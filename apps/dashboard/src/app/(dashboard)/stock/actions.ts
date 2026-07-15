"use server";

import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import { StockCorrectionReason, StockMovementType } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type StockListItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  originalQuantity: SelectPurchaseOrderItems["quantity"] | null;
};

export type PendingStockOption = Pick<SelectStock, "uuid" | "quantity"> & {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
};

export const getStock = async (): Promise<StockListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Stock),
        productCode: Products.productCode,
        productName: Products.name,
        companyName: Companies.companyName,
        purchaseOrderId: PurchaseOrders.id,
        originalQuantity: PurchaseOrderItems.quantity,
      })
      .from(Stock)
      .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(Companies, eq(Products.companyUuid, Companies.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        PurchaseOrderItems,
        eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .orderBy(desc(Stock.createdAt));
  } catch {
    throw new Error("Failed to fetch stock");
  }
};

export const getPendingStockForCompany = async (
  companyUuid: string,
): Promise<PendingStockOption[]> =>
  db
    .select({
      uuid: Stock.uuid,
      quantity: Stock.quantity,
      productUuid: Products.uuid,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Stock)
    .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
    .where(
      and(
        eq(Products.companyUuid, companyUuid),
        eq(Stock.status, "pending"),
        gt(Stock.quantity, "0"),
      ),
    )
    .orderBy(desc(Stock.createdAt));

export type StockCorrectionInput = {
  stockUuid: string;
  direction: StockMovementType;
  quantity: string;
  reason: StockCorrectionReason;
  note?: string;
};

export type StockActionResult = {
  error?: string;
  success?: boolean;
};

export const createStockCorrection = async (
  input: StockCorrectionInput,
): Promise<StockActionResult> => {
  try {
    const [stockRow] = await db
      .select()
      .from(Stock)
      .where(eq(Stock.uuid, input.stockUuid))
      .limit(1);

    if (!stockRow) {
      return { error: "Stock item not found." };
    }

    if (stockRow.status === "cancelled") {
      return { error: "Cannot correct a cancelled stock item." };
    }

    if (
      input.direction === "out" &&
      Number(input.quantity) > Number(stockRow.quantity)
    ) {
      return {
        error: `Cannot remove more than the available quantity (${stockRow.quantity}).`,
      };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const delta =
      input.direction === "in" ? Number(input.quantity) : -Number(input.quantity);
    const nextQuantity = (Number(stockRow.quantity) + delta).toFixed(3);

    await db.transaction(async (tx) => {
      // Optimistic lock: only apply if the quantity we read hasn't changed —
      // otherwise another correction/consumption raced us and we roll back.
      const [updateResult] = await tx
        .update(Stock)
        .set({
          quantity: nextQuantity,
          status: Number(nextQuantity) > 0 ? "pending" : "received",
        })
        .where(
          and(
            eq(Stock.uuid, input.stockUuid),
            eq(Stock.quantity, stockRow.quantity),
          ),
        );

      if (updateResult.affectedRows === 0) {
        throw new Error(
          "Stock changed while applying this correction — please refresh and try again.",
        );
      }

      await tx.insert(StockMovements).values({
        uuid: generateUuid(),
        productUuid: stockRow.productUuid,
        stockUuid: input.stockUuid,
        type: input.direction,
        reason: input.reason,
        quantity: input.quantity,
        note: input.note || null,
        createdByUserId: userId,
      });
    });

    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to apply stock correction",
    };
  }
};
