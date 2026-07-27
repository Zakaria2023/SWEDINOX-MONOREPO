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
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
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

      const items = await db
        .select({
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
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid));

      if (items.length === 0) {
        return { error: "No order lines to plan. Create an order first." };
      }

      const existing = await db
        .select({
          orderNumber: ProductionWorkOrderLines.orderNumber,
          productUuid: ProductionWorkOrderLines.productUuid,
        })
        .from(ProductionWorkOrderLines);

      const existingKeys = new Set(
        existing.map((line) => `${line.orderNumber}|${line.productUuid}`),
      );

      const newItems = items.filter(
        (item) => !existingKeys.has(`${item.orderId}|${item.productUuid}`),
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

// Completing a production line books the finished goods into stock: a new
// stock lot for the produced product plus an "in" movement. Raw-material
// consumption is not modelled yet (no input lot is linked to the line).
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

    const quantity = Number(line.qtyActual ?? line.qtyPlanned ?? 0);
    if (quantity <= 0) {
      return { error: "Set a produced quantity before completing." };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const productUuid = line.productUuid;
    const stockUuid = generateUuid();

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

      if (update.affectedRows === 0) {
        throw new Error(
          "This line changed while completing — please refresh and try again.",
        );
      }

      await tx.insert(Stock).values({
        uuid: stockUuid,
        productUuid,
        quantity: quantity.toFixed(3),
        quantityKg: Number(line.kgActual ?? line.kgPlanned ?? 0).toFixed(2),
        status: "received",
      });

      await tx.insert(StockMovements).values({
        uuid: generateUuid(),
        productUuid,
        stockUuid,
        type: "in",
        reason: "production_output",
        quantity: quantity.toFixed(3),
        createdByUserId: userId,
      });

      await recordFreightMovement(tx, {
        productUuid,
        quantity: quantity.toFixed(3),
        type: "in",
        reason: "production_output",
        companyUuid: line.companyUuid,
        operator: userId,
      });
    });

    revalidatePath("/production-workorders");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
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
