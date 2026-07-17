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
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { desc, eq, getTableColumns } from "drizzle-orm";

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
  } catch {
    throw new Error("Failed to fetch purchase quotes");
  }
};
