"use server";

import { db } from "@/db";
import { JournalEntries } from "@/db/schema/journal-entries";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { mailDocument, sendDeliveryNoteEmail } from "@/emails/documents";
import {
  describeError,
  generateUuid,
  restateLotValue,
  todayDateString,
} from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import {
  buildInventoryMovementEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, desc, eq, getTableColumns, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type DeliveryActionResult = {
  error?: string;
  success?: boolean;
};

export type DeliveryLineItem = SelectOrderItems & {
  orderId: SelectOrders["id"] | null;
  orderCategory: SelectOrders["orderCategory"] | null;
  customerName: SelectCompanies["companyName"] | null;
  customerRef: SelectOrders["customerRef"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

const lineColumns = {
  ...getTableColumns(OrderItems),
  orderId: Orders.id,
  orderCategory: Orders.orderCategory,
  customerName: Companies.companyName,
  customerRef: Orders.customerRef,
  productCode: Products.productCode,
  productName: Products.name,
};

// Deliverable order lines — everything not cancelled, newest first.
export const getDeliveries = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(ne(OrderItems.status, "cancelled"))
      .orderBy(desc(OrderItems.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch deliveries"));
  }
};

// Lines held back by a commercial, financial or transport block.
export const getBlockedDeliveries = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(
        or(
          eq(OrderItems.commercialBlock, true),
          eq(OrderItems.financialBlock, true),
          eq(OrderItems.transportBlock, true),
        ),
      )
      .orderBy(desc(OrderItems.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch blocked deliveries"));
  }
};

// Deliver a reserved order line: this is where stock physically leaves the
// warehouse. It consumes the reserved stock and writes the "out" movement, so
// invoicing afterwards is purely financial. Cancelling the invoice does NOT
// bring the stock back — the goods have already shipped.
export const deliverOrderItem = async (
  orderItemUuid: string,
): Promise<DeliveryActionResult> => {
  try {
    const [orderItem] = await db
      .select()
      .from(OrderItems)
      .where(eq(OrderItems.uuid, orderItemUuid))
      .limit(1);

    if (!orderItem) {
      return { error: "Order line not found." };
    }

    if (orderItem.status !== "reserved") {
      return { error: "Only a reserved line can be delivered." };
    }

    // A block has to actually stop the goods, or it is only a label. Both the
    // line's own holds and the order's financial block are refused here, and
    // both are lifted the same way: deliberately, by someone with the
    // authority, leaving a record of who did it.
    if (orderItem.commercialBlock) {
      return { error: "This line is on a commercial block." };
    }
    if (orderItem.financialBlock) {
      return { error: "This line is on a financial block." };
    }
    if (orderItem.transportBlock) {
      return { error: "This line is on a transport block." };
    }

    const [order] = await db
      .select({
        id: Orders.id,
        companyUuid: Orders.companyUuid,
        financialBlockage: Orders.financialBlockage,
        blockingReason: Orders.blockingReason,
      })
      .from(Orders)
      .where(eq(Orders.uuid, orderItem.orderUuid))
      .limit(1);

    if (order?.financialBlockage) {
      return {
        error: order.blockingReason
          ? `This order is financially blocked — ${order.blockingReason}. Release it on the Financially Blocked overview before delivering.`
          : "This order is financially blocked. Release it on the Financially Blocked overview before delivering.",
      };
    }

    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      // Guard: only deliver a line that's still "reserved".
      const [itemUpdate] = await tx
        .update(OrderItems)
        .set({
          status: "delivered",
          deliveryStatus: "delivered",
          lineStatus: "delivered",
          deliveryDate: todayDateString(),
        })
        .where(
          and(
            eq(OrderItems.uuid, orderItemUuid),
            eq(OrderItems.status, "reserved"),
          ),
        );

      if (itemUpdate.affectedRows === 0) {
        throw new Error(
          "This line was already delivered or cancelled — please refresh and try again.",
        );
      }

      const [stockRow] = await tx
        .select()
        .from(Stock)
        .where(eq(Stock.uuid, orderItem.stockUuid))
        .limit(1);

      if (stockRow) {
        const nextQuantity = (
          Number(stockRow.quantity) - Number(orderItem.quantity)
        ).toFixed(3);
        const nextReserved = (
          Number(stockRow.reservedQuantity) - Number(orderItem.quantity)
        ).toFixed(3);

        const previousValue = Number(stockRow.valuationEuro ?? 0);
        const nextValue = restateLotValue({
          previousQuantity: Number(stockRow.quantity),
          remainingQuantity: Number(nextQuantity),
          unitCost: Number(stockRow.valuationPrice ?? 0),
          previousValue,
        });

        const [stockUpdate] = await tx
          .update(Stock)
          .set({
            quantity: nextQuantity,
            reservedQuantity: nextReserved,
            status: Number(nextQuantity) > 0 ? "pending" : "received",
            // Shipping material out has to take its value with it. Reducing the
            // quantity alone left the remainder carrying the whole lot's value,
            // so stock valuation climbed a little with every delivery and never
            // came back down.
            valuationEuro: nextValue.toFixed(2),
          })
          .where(
            and(
              eq(Stock.uuid, orderItem.stockUuid),
              eq(Stock.quantity, stockRow.quantity),
              eq(Stock.reservedQuantity, stockRow.reservedQuantity),
            ),
          );

        if (stockUpdate.affectedRows === 0) {
          throw new Error(
            "Stock changed while delivering — please refresh and try again.",
          );
        }

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: orderItem.productUuid,
          stockUuid: orderItem.stockUuid,
          type: "out",
          reason: "sale_consumption",
          quantity: orderItem.quantity,
          orderUuid: orderItem.orderUuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: orderItem.productUuid,
          quantity: orderItem.quantity,
          type: "out",
          reason: "sale_consumption",
          orderUuid: orderItem.orderUuid,
          operator: userId,
        });

        // The stock ledger has to move when the stock does. The goods are no
        // longer on the shelf, but nobody has been billed for them either, so
        // their cost is parked until the invoice charges it to cost of sales.
        // Waiting for the invoice would leave the balance sheet claiming stock
        // that had already been shipped.
        //
        // The figure posted is the value the lot actually gave up, not what the
        // order line says it should have — that is what keeps the inventory
        // account reconcilable to the Stock table line by line.
        const valueOut = previousValue - nextValue;

        if (Math.abs(valueOut) >= 0.005) {
          await tx.insert(JournalEntries).values(
            buildInventoryMovementEntry({
              bookingDate: todayDateString(),
              documentNo: order?.id != null ? String(order.id) : null,
              description: "Goods delivered",
              companyUuid: order?.companyUuid ?? null,
              debCreditor: null,
              inventoryValue: -valueOut,
              counterAccount: LEDGER_ACCOUNTS.goodsDeliveredNotInvoiced,
              reference: `Order line ${orderItemUuid}`,
              userId,
            }),
          );
        }
      }
    });

    // The goods have physically left, so the customer is told what shipped.
    // Sent after the transaction commits and never allowed to fail the
    // delivery — the stock is already gone either way.
    await mailDocument(
      () => sendDeliveryNoteEmail(orderItemUuid),
      `Delivery note for order line ${orderItemUuid}`,
    );

    revalidatePath("/deliveries");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to deliver order line",
    };
  }
};

// Lines still to be arranged that hold no stock reservation yet.
export const getDeliveriesToArrange = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(eq(OrderItems.qtyReserved, "0.000"))
      // A worklist is worked customer by customer, so the sort is part of the
      // screen rather than a default — the reference orders by customer, then
      // by the date the promise falls due.
      .orderBy(asc(Companies.companyName), asc(OrderItems.deliveryDate));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch deliveries to arrange"),
    );
  }
};
