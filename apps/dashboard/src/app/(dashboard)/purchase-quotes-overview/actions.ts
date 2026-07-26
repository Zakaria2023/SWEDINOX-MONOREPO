"use server";

import { db } from "@/db";
import {
  PurchaseQuoteItems,
  SelectPurchaseQuoteItems,
} from "@/db/schema/purchase-quote-items";
import {
  PurchaseQuotes,
  SelectPurchaseQuotes,
} from "@/db/schema/purchase-quotes";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { describeError, generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseQuoteLineItem = SelectPurchaseQuoteItems & {
  quoteId: SelectPurchaseQuotes["id"] | null;
  quoteDate: SelectPurchaseQuotes["quoteDate"] | null;
  validUntil: SelectPurchaseQuotes["validUntil"] | null;
  quoteNumberSupplier: SelectPurchaseQuotes["quoteNumber"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
};

export type GenerateQuoteLinesResult = {
  error?: string;
  success?: boolean;
};

export const getPurchaseQuoteLines = async (): Promise<
  PurchaseQuoteLineItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseQuoteItems),
        quoteId: PurchaseQuotes.id,
        quoteDate: PurchaseQuotes.quoteDate,
        validUntil: PurchaseQuotes.validUntil,
        quoteNumberSupplier: PurchaseQuotes.quoteNumber,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
      })
      .from(PurchaseQuoteItems)
      .innerJoin(
        PurchaseQuotes,
        eq(PurchaseQuoteItems.purchaseQuoteUuid, PurchaseQuotes.uuid),
      )
      .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseQuoteItems.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(PurchaseQuoteItems.revenueGroupUuid, RevenueGroups.uuid),
      )
      .orderBy(desc(PurchaseQuotes.quoteDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase quotes"));
  }
};

// Fills purchase quotes that have no lines yet. Lines are taken from what has
// actually been ordered from that supplier (their purchase-order lines); if the
// supplier has none, their product catalogue is used with a quantity of 1.
// Quotes that already have lines are skipped, so it can be re-run.
export const generatePurchaseQuoteLines =
  async (): Promise<GenerateQuoteLinesResult> => {
    try {
      const quotes = await db
        .select({
          uuid: PurchaseQuotes.uuid,
          companyUuid: PurchaseQuotes.companyUuid,
          quoteNumber: PurchaseQuotes.quoteNumber,
        })
        .from(PurchaseQuotes);

      if (quotes.length === 0) {
        return { error: "No purchase quotes yet. Create one first." };
      }

      const existing = await db
        .select({ purchaseQuoteUuid: PurchaseQuoteItems.purchaseQuoteUuid })
        .from(PurchaseQuoteItems);

      const quotesWithLines = new Set(
        existing.map((row) => row.purchaseQuoteUuid),
      );

      const emptyQuotes = quotes.filter(
        (quote) => !quotesWithLines.has(quote.uuid),
      );

      if (emptyQuotes.length === 0) {
        return { error: "Every purchase quote already has lines." };
      }

      const rows: (typeof PurchaseQuoteItems.$inferInsert)[] = [];

      for (const quote of emptyQuotes) {
        if (!quote.companyUuid) {
          continue;
        }

        const orderedLines = await db
          .select({
            productUuid: PurchaseOrderItems.productUuid,
            quantity: PurchaseOrderItems.quantity,
            unit: PurchaseOrderItems.unit,
            kgPurchased: PurchaseOrderItems.kgPurchased,
            lengthMm: PurchaseOrderItems.lengthMm,
            widthMm: PurchaseOrderItems.widthMm,
            thicknessMm: PurchaseOrderItems.thicknessMm,
            productName: Products.name,
            revenueGroupUuid: Products.revenueGroupUuid,
          })
          .from(PurchaseOrderItems)
          .innerJoin(
            PurchaseOrders,
            eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
          )
          .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
          .where(eq(PurchaseOrders.supplierUuid, quote.companyUuid));

        const sourceLines =
          orderedLines.length > 0
            ? orderedLines
            : (
                await db
                  .select({
                    productUuid: Products.uuid,
                    productName: Products.name,
                    revenueGroupUuid: Products.revenueGroupUuid,
                  })
                  .from(Products)
                  .where(eq(Products.companyUuid, quote.companyUuid))
              ).map((product) => ({
                productUuid: product.productUuid,
                quantity: "1.000",
                unit: null,
                kgPurchased: null,
                lengthMm: null,
                widthMm: null,
                thicknessMm: null,
                productName: product.productName,
                revenueGroupUuid: product.revenueGroupUuid,
              }));

        for (const [index, line] of sourceLines.entries()) {
          rows.push({
            uuid: generateUuid(),
            purchaseQuoteUuid: quote.uuid,
            productUuid: line.productUuid,
            revenueGroupUuid: line.revenueGroupUuid,
            lineNumber: index + 1,
            description: line.productName,
            quantity: line.quantity,
            unit: line.unit ?? "st",
            kg: line.kgPurchased ?? "0.00",
            lengthMm: line.lengthMm,
            widthMm: line.widthMm,
            thicknessMm: line.thicknessMm,
            purchaseReference: quote.quoteNumber,
          });
        }
      }

      if (rows.length === 0) {
        return {
          error:
            "Nothing to quote — the quote's supplier has no ordered lines or products.",
        };
      }

      await db.insert(PurchaseQuoteItems).values(rows);

      revalidatePath("/purchase-quotes-overview");
      return { success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate purchase quote lines",
      };
    }
  };
