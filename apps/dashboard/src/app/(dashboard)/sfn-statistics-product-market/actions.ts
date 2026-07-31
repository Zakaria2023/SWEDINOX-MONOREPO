"use server";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { describeError } from "@/lib/helpers";
import { eq, sql } from "drizzle-orm";

// One SFN statistics product-market combination row.
export type SfnStatisticRow = {
  key: string;
  cbsStatNr: string | null;
  sbiCode: string | null;
  postalCode: string | null;
  year: number | null;
  month: number | null;
  weightKg: number;
};

// SFN statistics group invoiced goods into product-market combinations: the
// CBS commodity number the goods fall under, crossed with the SBI industry code
// and postal area of the customer that bought them, per month.
//
// The commodity number comes off the product and the SBI code off the company
// (`Companies.industry` holds it), so a combination only forms once both are
// filled in — rows missing either are still returned rather than dropped,
// because a blank statistical code is itself the thing that needs fixing before
// the return can be filed.
export const getSfnStatistics = async (): Promise<SfnStatisticRow[]> => {
  try {
    const rows = await db
      .select({
        cbsStatNr: Products.commodityCode,
        sbiCode: Companies.industry,
        postalCode: sql<string | null>`MIN(${CompanyAddresses.postalCode})`,
        year: sql<number>`YEAR(${Invoices.invoiceDate})`,
        month: sql<number>`MONTH(${Invoices.invoiceDate})`,
        weightKg: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(
        CompanyAddresses,
        eq(CompanyAddresses.companyUuid, Companies.uuid),
      )
      .groupBy(
        Products.commodityCode,
        Companies.industry,
        sql`YEAR(${Invoices.invoiceDate})`,
        sql`MONTH(${Invoices.invoiceDate})`,
      );

    return rows
      .map((row) => ({
        key: [row.year, row.month, row.cbsStatNr, row.sbiCode].join("-"),
        cbsStatNr: row.cbsStatNr,
        sbiCode: row.sbiCode,
        postalCode: row.postalCode,
        year: row.year,
        month: row.month,
        weightKg: Number(row.weightKg),
      }))
      .sort(
        (a, b) =>
          (b.year ?? 0) - (a.year ?? 0) ||
          (b.month ?? 0) - (a.month ?? 0) ||
          (a.cbsStatNr ?? "").localeCompare(b.cbsStatNr ?? ""),
      );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch SFN statistics"));
  }
};
