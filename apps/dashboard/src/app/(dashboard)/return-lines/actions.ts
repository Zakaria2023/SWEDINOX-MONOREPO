"use server";

import { db } from "@/db";
import {
  ReturnOrderItems,
  SelectReturnOrderItems,
} from "@/db/schema/return-order-items";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ReturnLineItem = SelectReturnOrderItems & {
  returnOrderId: SelectReturnOrders["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  // Computed margin figures (no single column backs them).
  profit: number;
  profitMargin: number;
};

export const getReturnLines = async (): Promise<ReturnLineItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(ReturnOrderItems),
        returnOrderId: ReturnOrders.id,
        customerName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(ReturnOrderItems)
      .leftJoin(
        ReturnOrders,
        eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
      )
      .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(ReturnOrderItems.productUuid, Products.uuid))
      .orderBy(desc(ReturnOrderItems.createdAt));

    return rows.map((row) => {
      const amount = Number(row.amount);
      const cost = Number(row.costPrice) * Number(row.quantity);
      const profit = amount - cost;
      return {
        ...row,
        profit,
        profitMargin: amount === 0 ? 0 : (profit / amount) * 100,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch return lines"));
  }
};

export type GenerateReturnLinesResult = {
  error?: string;
  success?: boolean;
};

// Turns sales orders into return orders + return lines — one return order per
// order (linked via orderUuid), with a return line mirroring each order item.
// Orders that already have a return order are skipped, so it can be re-run.
export const generateReturnLinesFromOrders =
  async (): Promise<GenerateReturnLinesResult> => {
    try {
      const orders = await db
        .select({
          uuid: Orders.uuid,
          id: Orders.id,
          companyUuid: Orders.companyUuid,
          contactUuid: Orders.contactUuid,
        })
        .from(Orders);
      if (orders.length === 0) {
        return { error: "No orders to return from. Create an order first." };
      }

      const existingReturns = await db
        .select({ orderUuid: ReturnOrders.orderUuid })
        .from(ReturnOrders);
      const returnedOrderUuids = new Set(
        existingReturns
          .map((row) => row.orderUuid)
          .filter((uuid): uuid is string => uuid !== null),
      );

      const newOrders = orders.filter(
        (order) => !returnedOrderUuids.has(order.uuid),
      );
      if (newOrders.length === 0) {
        return { error: "Every order already has a return order." };
      }

      const today = todayDateString();

      await db.transaction(async (tx) => {
        for (const order of newOrders) {
          const items = await tx
            .select({
              productUuid: OrderItems.productUuid,
              quantity: OrderItems.quantity,
              unit: OrderItems.unit,
              lineNumber: OrderItems.lineNumber,
              lengthMm: OrderItems.lengthMm,
              widthMm: OrderItems.widthMm,
              thicknessMm: OrderItems.thicknessMm,
              grossPrice: OrderItems.grossPrice,
              amount: OrderItems.amount,
              deliveryDate: OrderItems.deliveryDate,
            })
            .from(OrderItems)
            .where(eq(OrderItems.orderUuid, order.uuid));
          if (items.length === 0) {
            continue;
          }

          const returnOrderUuid = generateUuid();
          await tx.insert(ReturnOrders).values({
            uuid: returnOrderUuid,
            companyUuid: order.companyUuid,
            orderUuid: order.uuid,
            orderReference: String(order.id),
            contactUuid: order.contactUuid,
            status: "open",
            orderDate: today,
          });

          let lineNumber = 1;
          for (const item of items) {
            await tx.insert(ReturnOrderItems).values({
              uuid: generateUuid(),
              returnOrderUuid,
              productUuid: item.productUuid,
              originalOrderUuid: order.uuid,
              originalOrderLine: item.lineNumber,
              lineNumber: lineNumber++,
              quantity: item.quantity,
              returnQty: item.quantity,
              unit: item.unit,
              lengthMm: item.lengthMm,
              widthMm: item.widthMm,
              thicknessMm: item.thicknessMm,
              netPrice: item.grossPrice,
              amount: item.amount,
              deliveryDate: item.deliveryDate,
              reference: String(order.id),
            });
          }
        }
      });

      revalidatePath("/return-lines");
      revalidatePath("/return-orders");
      return { success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate return lines",
      };
    }
  };
