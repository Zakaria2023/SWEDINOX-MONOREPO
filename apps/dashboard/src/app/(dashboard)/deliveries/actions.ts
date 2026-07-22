"use server";

import { db } from "@/db";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { generateUuid, todayDateString } from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, ne, or } from "drizzle-orm";
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
  } catch {
    throw new Error("Failed to fetch deliveries");
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
  } catch {
    throw new Error("Failed to fetch blocked deliveries");
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

        const [stockUpdate] = await tx
          .update(Stock)
          .set({
            quantity: nextQuantity,
            reservedQuantity: nextReserved,
            status: Number(nextQuantity) > 0 ? "pending" : "received",
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
      }
    });

    revalidatePath("/deliveries");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    revalidatePath("/reservations");
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
      .orderBy(desc(OrderItems.createdAt));
  } catch {
    throw new Error("Failed to fetch deliveries to arrange");
  }
};
