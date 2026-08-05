"use server";

import { db } from "@/db";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
  SelectProductionWorkOrderLines,
  SelectProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Machines, SelectMachines } from "@/db/schema/machines";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import {
  describeError,
  generateUuid,
  productionYield,
  profitMarginPercent,
  restateLotValue,
  todayDateString,
} from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type WorkOrderActionResult = {
  error?: string;
  success?: boolean;
};

export type ProductionWorkOrderLineItem = SelectProductionWorkOrderLines & {
  option: SelectProductionWorkOrders["option"] | null;
  workOrderDate: SelectProductionWorkOrders["date"] | null;
  machineName: SelectMachines["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  productName: SelectProducts["name"] | null;
};

export type ProductionWorkOrderLineDetail = ProductionWorkOrderLineItem & {
  workOrderStatus: SelectProductionWorkOrders["status"] | null;
  workOrderId: SelectProductionWorkOrders["id"] | null;
  machineUuid: SelectMachines["uuid"] | null;
  machineCode: SelectMachines["code"] | null;
  // The catalogue product's own code, kept apart from the line's snapshot in
  // `productCode` so a product later recoded doesn't appear to rewrite the run.
  catalogProductCode: SelectProducts["productCode"] | null;
};

export const getProductionWorkOrderLines = async (): Promise<
  ProductionWorkOrderLineItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(ProductionWorkOrderLines),
        option: ProductionWorkOrders.option,
        workOrderDate: ProductionWorkOrders.date,
        machineName: Machines.name,
        companyName: Companies.companyName,
        productName: Products.name,
      })
      .from(ProductionWorkOrderLines)
      .innerJoin(
        ProductionWorkOrders,
        eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
      )
      .leftJoin(Machines, eq(ProductionWorkOrders.machineUuid, Machines.uuid))
      .leftJoin(
        Companies,
        eq(ProductionWorkOrderLines.companyUuid, Companies.uuid),
      )
      .leftJoin(
        Products,
        eq(ProductionWorkOrderLines.productUuid, Products.uuid),
      )
      .orderBy(desc(ProductionWorkOrderLines.createdAt));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch production work orders"),
    );
  }
};

/**
 * One production work-order line with the work order it sits under, the machine
 * that runs it, and the customer and product it is for.
 */
export const getProductionWorkOrderLineDetail = async (
  uuid: string,
): Promise<ProductionWorkOrderLineDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(ProductionWorkOrderLines),
      option: ProductionWorkOrders.option,
      workOrderDate: ProductionWorkOrders.date,
      workOrderStatus: ProductionWorkOrders.status,
      workOrderId: ProductionWorkOrders.id,
      machineUuid: Machines.uuid,
      machineName: Machines.name,
      machineCode: Machines.code,
      companyName: Companies.companyName,
      productName: Products.name,
      catalogProductCode: Products.productCode,
    })
    .from(ProductionWorkOrderLines)
    .innerJoin(
      ProductionWorkOrders,
      eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
    )
    .leftJoin(Machines, eq(ProductionWorkOrders.machineUuid, Machines.uuid))
    .leftJoin(
      Companies,
      eq(ProductionWorkOrderLines.companyUuid, Companies.uuid),
    )
    .leftJoin(Products, eq(ProductionWorkOrderLines.productUuid, Products.uuid))
    .where(eq(ProductionWorkOrderLines.uuid, uuid))
    .limit(1);

  return row ?? null;
};

// Turns the order lines into production work-order lines to run — one line per
// order item, grouped under a single work order on the first machine. Order
// lines that already have a production line are skipped, so it can be re-run as
// new orders come in.
export const generateProductionWorkOrders =
  async (): Promise<WorkOrderActionResult> => {
    try {
      const [machine] = await db
        .select({ uuid: Machines.uuid })
        .from(Machines)
        .limit(1);

      if (!machine) {
        return { error: "Create a machine first (Logistics → Machines)." };
      }

      // Only lines still holding their reservation can be planned. A line that
      // has shipped or been billed has no material left to process, and one
      // that was cancelled or returned never will.
      const items = await db
        .select({
          orderItemUuid: OrderItems.uuid,
          productUuid: OrderItems.productUuid,
          productCode: Products.productCode,
          quantity: OrderItems.quantity,
          qtyPlanned: OrderItems.qtyPlanned,
          unit: OrderItems.unit,
          kgPlanned: OrderItems.kgPlanned,
          thicknessMm: OrderItems.thicknessMm,
          deliveryDate: OrderItems.deliveryDate,
          isPickup: OrderItems.isPickup,
          orderId: Orders.id,
          companyUuid: Orders.companyUuid,
        })
        .from(OrderItems)
        .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
        .where(inArray(OrderItems.status, ["reserved"]));

      if (items.length === 0) {
        return {
          error: "No reserved order lines to plan. Create an order first.",
        };
      }

      // Dedupe on the order line itself. Keying on order number and product
      // collapsed two lines of the same product on one order into one, so the
      // second was never planned — and now that completing a line consumes its
      // reserved lot, planning the wrong line would consume the wrong material.
      const existing = await db
        .select({ orderItemUuid: ProductionWorkOrderLines.orderItemUuid })
        .from(ProductionWorkOrderLines);

      const existingKeys = new Set(
        existing.flatMap((line) =>
          line.orderItemUuid ? [line.orderItemUuid] : [],
        ),
      );

      const newItems = items.filter(
        (item) => !existingKeys.has(item.orderItemUuid),
      );

      if (newItems.length === 0) {
        return { error: "All order lines are already planned." };
      }

      const today = todayDateString();
      const workOrderUuid = generateUuid();

      await db.transaction(async (tx) => {
        await tx.insert(ProductionWorkOrders).values({
          uuid: workOrderUuid,
          machineUuid: machine.uuid,
          date: today,
          status: "new",
        });

        for (const item of newItems) {
          await tx.insert(ProductionWorkOrderLines).values({
            uuid: generateUuid(),
            workOrderUuid,
            date: today,
            status: "new",
            productUuid: item.productUuid,
            productCode: item.productCode,
            orderNumber: String(item.orderId),
            orderItemUuid: item.orderItemUuid,
            companyUuid: item.companyUuid,
            thicknessMm: item.thicknessMm,
            qtyPlanned: item.qtyPlanned ?? item.quantity,
            unitPlanned: item.unit,
            kgPlanned: item.kgPlanned,
            deliverOn: item.deliveryDate,
            isPickup: item.isPickup ?? false,
          });
        }
      });

      revalidatePath("/production-workorders");
      return { success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate production work orders",
      };
    }
  };

// Completing a production line transforms the lot the order line reserved.
//
// Sawing destroys the lot it came from: what leaves the machine is the
// customer's goods, a usable offcut, and waste. So this draws the material out
// of the input lot, books the produced lot and any remnant, writes the waste
// off, and hands the order line its new lot to be delivered from.
//
// It used to mint a lot for the produced goods and touch the input lot not at
// all — so the same steel existed twice in stock, and the phantom lot was never
// consumed by anything, because delivery only ever draws down the lot the order
// reserved. Inventory grew, in quantity and in value, with every completed line.
export const completeProductionWorkOrderLine = async (
  lineUuid: string,
): Promise<WorkOrderActionResult> => {
  try {
    const [line] = await db
      .select()
      .from(ProductionWorkOrderLines)
      .where(eq(ProductionWorkOrderLines.uuid, lineUuid))
      .limit(1);

    if (!line) {
      return { error: "Production line not found." };
    }
    if (line.status === "completed") {
      return { error: "This line is already completed." };
    }
    if (!line.productUuid) {
      return { error: "This line has no product to book into stock." };
    }
    if (!line.orderItemUuid) {
      return {
        error:
          "This line isn't linked to an order line, so there is no reserved material to process. Re-generate the work orders.",
      };
    }

    const produced = Number(line.qtyActual ?? line.qtyPlanned ?? 0);
    if (produced <= 0) {
      return { error: "Set a produced quantity before completing." };
    }
    const remnant = Number(line.qtyBack ?? 0);
    if (remnant < 0) {
      return { error: "A remnant cannot be negative." };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const productUuid = line.productUuid;
    const orderItemUuid = line.orderItemUuid;
    const producedStockUuid = generateUuid();
    const remnantStockUuid = generateUuid();

    await db.transaction(async (tx) => {
      const [update] = await tx
        .update(ProductionWorkOrderLines)
        .set({ status: "completed" })
        .where(
          and(
            eq(ProductionWorkOrderLines.uuid, lineUuid),
            eq(ProductionWorkOrderLines.status, line.status),
          ),
        );

      // Claiming the status first means two people completing the same line at
      // once cannot both consume the input lot.
      if (update.affectedRows === 0) {
        throw new Error(
          "This line changed while completing — please refresh and try again.",
        );
      }

      const [orderItem] = await tx
        .select({
          uuid: OrderItems.uuid,
          status: OrderItems.status,
          stockUuid: OrderItems.stockUuid,
          quantity: OrderItems.quantity,
          netPrice: OrderItems.netPrice,
          replacementPrice: OrderItems.replacementPrice,
        })
        .from(OrderItems)
        .where(eq(OrderItems.uuid, orderItemUuid))
        .limit(1);

      if (!orderItem) {
        throw new Error("The order line this run is for no longer exists.");
      }
      // Only a line still holding its reservation can be processed. Once it has
      // shipped or been billed the goods have left, and re-cutting them would
      // consume material that is no longer there.
      if (orderItem.status !== "reserved") {
        throw new Error(
          `Only a reserved order line can be produced — this one is ${orderItem.status}.`,
        );
      }

      const [inputLot] = await tx
        .select()
        .from(Stock)
        .where(eq(Stock.uuid, orderItem.stockUuid))
        .limit(1);

      if (!inputLot) {
        throw new Error("The reserved stock lot could not be found.");
      }

      // What the run takes to the machine is what the order line reserved.
      const consumed = Number(orderItem.quantity);
      const inputUnitCost = Number(inputLot.valuationPrice ?? 0);
      const yieldResult = productionYield({
        consumed,
        produced,
        remnant,
        inputUnitCost,
      });

      if (yieldResult.impossible) {
        throw new Error(
          `More was produced than consumed: ${produced} produced plus ${remnant} remnant against ${consumed} reserved.`,
        );
      }

      // Draw the material out of the input lot. The guard means the lot cannot
      // go negative if something else consumed from it in the meantime.
      const inputRemaining = Number(inputLot.quantity) - consumed;
      const [lotUpdate] = await tx
        .update(Stock)
        .set({
          quantity: inputRemaining.toFixed(3),
          reservedQuantity: (
            Number(inputLot.reservedQuantity) - consumed
          ).toFixed(3),
          // Restated, or the lot would hold less material at its old value and
          // the run would appear to create €120 of stock out of nothing.
          valuationEuro: restateLotValue({
            previousQuantity: Number(inputLot.quantity),
            remainingQuantity: inputRemaining,
            unitCost: inputUnitCost,
            previousValue: Number(inputLot.valuationEuro ?? 0),
          }).toFixed(2),
        })
        .where(
          and(
            eq(Stock.uuid, inputLot.uuid),
            gte(Stock.quantity, consumed.toFixed(3)),
            gte(Stock.reservedQuantity, consumed.toFixed(3)),
          ),
        );

      if (lotUpdate.affectedRows === 0) {
        throw new Error(
          "The reserved lot changed while producing — please refresh and try again.",
        );
      }

      await tx.insert(StockMovements).values({
        uuid: generateUuid(),
        productUuid,
        stockUuid: inputLot.uuid,
        type: "out",
        reason: "production_input",
        quantity: consumed.toFixed(3),
        createdByUserId: userId,
      });

      // The produced lot carries the material cost of the run less the
      // remnant's — waste included, so a wasteful run shows in the margin
      // rather than hiding in stock.
      await tx.insert(Stock).values({
        uuid: producedStockUuid,
        productUuid,
        quantity: produced.toFixed(3),
        // Reserved for the order line it was cut for, exactly as the input lot
        // was, so nobody else can sell it out from under that customer.
        reservedQuantity: produced.toFixed(3),
        quantityKg: Number(line.kgActual ?? line.kgPlanned ?? 0).toFixed(2),
        status: "pending",
        lengthMm: inputLot.lengthMm,
        widthMm: inputLot.widthMm,
        thicknessMm: line.thicknessMm ?? inputLot.thicknessMm,
        quality: inputLot.quality,
        unit: inputLot.unit,
        locationUuid: inputLot.locationUuid,
        supplierUuid: inputLot.supplierUuid,
        charge: inputLot.charge,
        valuationPrice: yieldResult.producedUnitCost.toFixed(4),
        valuationEuro: yieldResult.producedCost.toFixed(2),
      });

      await tx.insert(StockMovements).values({
        uuid: generateUuid(),
        productUuid,
        stockUuid: producedStockUuid,
        type: "in",
        reason: "production_output",
        quantity: produced.toFixed(3),
        createdByUserId: userId,
      });

      // Point the order line at what it will actually be delivered from —
      // without this, delivery would go looking for material that has been cut
      // up — and restate it to what the run actually made.
      //
      // The agreed prices are snapshots and stay untouched; only the figures
      // that depend on quantity and on what the goods now cost are recomputed.
      // A run that wasted material therefore shows a thinner margin on the line
      // that caused it, which is the whole point of charging waste to the
      // output: it stops bad sawing disappearing into the stock valuation.
      const netPrice = Number(orderItem.netPrice ?? 0);
      const replacementPrice = Number(orderItem.replacementPrice ?? 0);
      const amount = netPrice * produced;
      const profit = amount - yieldResult.producedCost;

      await tx
        .update(OrderItems)
        .set({
          stockUuid: producedStockUuid,
          quantity: produced.toFixed(3),
          qtyReserved: produced.toFixed(3),
          amount: amount.toFixed(2),
          costPrice: yieldResult.producedUnitCost.toFixed(4),
          costAmount: yieldResult.producedCost.toFixed(2),
          profit: profit.toFixed(2),
          profitMargin: profitMarginPercent(amount, profit).toFixed(2),
          profitReplPrice: (amount - replacementPrice * produced).toFixed(2),
        })
        .where(eq(OrderItems.uuid, orderItemUuid));

      if (remnant > 0) {
        // The offcut is the same material in a shorter length, free for anyone
        // to order — so it goes back unreserved, at the input's unit cost.
        await tx.insert(Stock).values({
          uuid: remnantStockUuid,
          productUuid,
          quantity: remnant.toFixed(3),
          reservedQuantity: "0.000",
          status: "pending",
          widthMm: inputLot.widthMm,
          thicknessMm: inputLot.thicknessMm,
          quality: inputLot.quality,
          unit: inputLot.unit,
          locationUuid: inputLot.locationUuid,
          supplierUuid: inputLot.supplierUuid,
          charge: inputLot.charge,
          valuationPrice: inputUnitCost.toFixed(4),
          valuationEuro: yieldResult.remnantCost.toFixed(2),
          remark: "Production remnant",
        });

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid,
          stockUuid: remnantStockUuid,
          type: "in",
          reason: "production_remnant",
          quantity: remnant.toFixed(3),
          createdByUserId: userId,
        });
      }

      if (yieldResult.waste > 0) {
        // Waste is recorded against the lot it was cut from, which is what makes
        // it attributable on the sawing-waste control list.
        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid,
          stockUuid: inputLot.uuid,
          type: "out",
          reason: "sawing_waste",
          quantity: yieldResult.waste.toFixed(3),
          createdByUserId: userId,
        });
      }

      await recordFreightMovement(tx, {
        productUuid,
        quantity: produced.toFixed(3),
        type: "in",
        reason: "production_output",
        companyUuid: line.companyUuid,
        operator: userId,
      });
    });

    revalidatePath("/production-workorders");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    revalidatePath("/control-sawing-waste");
    revalidatePath("/deliveries");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete production line",
    };
  }
};
