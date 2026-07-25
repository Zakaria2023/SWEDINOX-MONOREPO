"use server";

import { db } from "@/db";
import { Batches, SelectBatches } from "@/db/schema/batches";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import {
  describeError,
  formatInternalChargeNumber,
  generateUuid,
} from "@/lib/helpers";
import { asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type BatchRow = SelectBatches & {
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  supplierCode: SelectCompanies["id"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type GenerateBatchesResult = {
  error?: string;
  success?: boolean;
  createdBatches?: number;
};

// Every registered batch, joined to the purchase order it arrived on, its
// supplier and its product.
export const getBatches = async (): Promise<BatchRow[]> => {
  try {
    const rows = await db
      .select({
        batch: Batches,
        purchaseOrderId: PurchaseOrders.id,
        supplierCode: Companies.id,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(Batches)
      .leftJoin(
        PurchaseOrders,
        eq(Batches.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(Batches.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(Batches.productUuid, Products.uuid))
      .orderBy(desc(Batches.receiptDate), asc(Batches.internalCharge));

    return rows.map((row) => ({
      ...row.batch,
      purchaseOrderId: row.purchaseOrderId,
      supplierCode: row.supplierCode,
      supplierName: row.supplierName,
      productCode: row.productCode,
      productName: row.productName,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch batches"));
  }
};

// Registers a batch for every goods receipt that has none yet.
//
// The receival says what arrived and when; the stock lot it created carries the
// physical detail — the mill's charge number, quality, stock category and
// dimensions — so the two are combined into one traceable batch. A lot that has
// no internal charge number yet is given the next one for the receipt year, and
// the number is written back to the lot so stock and batch agree.
//
// Receivals that already have a batch are skipped, so it can be re-run after
// receiving more goods.
export const generateBatches = async (): Promise<GenerateBatchesResult> => {
  try {
    const receivals = await db
      .select({
        receival: PurchaseLineReceivals,
        supplierUuid: PurchaseOrders.supplierUuid,
        stockUuid: Stock.uuid,
        stockCharge: Stock.charge,
        stockInternalCharge: Stock.internalCharge,
        stockCategory: Stock.stockCategory,
        stockQuality: Stock.quality,
        stockOptions: Stock.options,
        stockLengthMm: Stock.lengthMm,
        stockWidthMm: Stock.widthMm,
        stockThicknessMm: Stock.thicknessMm,
        stockBundle: Stock.bundle,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        Stock,
        eq(
          PurchaseLineReceivals.purchaseOrderItemUuid,
          Stock.purchaseOrderItemUuid,
        ),
      );

    if (receivals.length === 0) {
      return {
        error:
          "No goods receipts yet. Receive a purchase order on /purchase-orders-to-be-received first.",
      };
    }

    const registered = new Set(
      (
        await db
          .select({
            purchaseLineReceivalUuid: Batches.purchaseLineReceivalUuid,
          })
          .from(Batches)
          .where(isNotNull(Batches.purchaseLineReceivalUuid))
      ).map((row) => row.purchaseLineReceivalUuid),
    );

    const openReceivals = receivals.filter(
      (row) => !registered.has(row.receival.uuid),
    );
    if (openReceivals.length === 0) {
      return { error: "Every goods receipt already has a batch." };
    }

    // Next internal charge sequence per year, continuing from what has already
    // been issued rather than restarting at 1.
    const issued = await db
      .select({
        year: sql<number>`YEAR(${Batches.receiptDate})`,
        count: sql<number>`COUNT(${Batches.uuid})`,
      })
      .from(Batches)
      .where(isNotNull(Batches.internalCharge))
      .groupBy(sql`YEAR(${Batches.receiptDate})`);

    const sequenceByYear = new Map<number, number>(
      issued.map((row) => [Number(row.year), Number(row.count)]),
    );

    const rows: (typeof Batches.$inferInsert)[] = [];
    const chargeUpdates: Array<{ stockUuid: string; internalCharge: string }> =
      [];

    for (const row of openReceivals) {
      const { receival } = row;
      const receiptDate = receival.receiptDate;
      const year = receiptDate
        ? Number(receiptDate.slice(0, 4))
        : new Date().getFullYear();

      let internalCharge = row.stockInternalCharge;
      if (!internalCharge) {
        const nextSequence = (sequenceByYear.get(year) ?? 0) + 1;
        sequenceByYear.set(year, nextSequence);
        internalCharge = formatInternalChargeNumber(year, nextSequence);
        if (row.stockUuid) {
          chargeUpdates.push({ stockUuid: row.stockUuid, internalCharge });
        }
      }

      rows.push({
        uuid: generateUuid(),
        purchaseOrderUuid: receival.purchaseOrderUuid,
        purchaseOrderItemUuid: receival.purchaseOrderItemUuid,
        purchaseLineReceivalUuid: receival.uuid,
        stockUuid: row.stockUuid,
        productUuid: receival.productUuid,
        supplierUuid: row.supplierUuid ?? receival.companyUuid,
        purchaseOrderCode: receival.purchaseOrderCode,
        receiptDate,
        lengthMm: row.stockLengthMm ?? receival.lengthMm,
        widthMm: row.stockWidthMm,
        thicknessMm: row.stockThicknessMm,
        qty: receival.receivedQty ?? "0.000",
        unit: receival.unit ?? "st",
        kg: receival.kgActual ?? "0.00",
        charge: row.stockCharge,
        internalCharge,
        sheetNumber: row.stockBundle,
        stockCategory: row.stockCategory,
        qualityCode: row.stockQuality,
        options: row.stockOptions ?? receival.options,
      });
    }

    await db.transaction(async (tx) => {
      await tx.insert(Batches).values(rows);
      for (const update of chargeUpdates) {
        await tx
          .update(Stock)
          .set({ internalCharge: update.internalCharge })
          .where(eq(Stock.uuid, update.stockUuid));
      }
    });

    revalidatePath("/batches");
    revalidatePath("/stock");
    return { success: true, createdBatches: rows.length };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to generate batches",
    };
  }
};
