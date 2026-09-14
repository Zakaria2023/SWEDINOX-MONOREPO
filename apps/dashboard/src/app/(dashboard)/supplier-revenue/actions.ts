"use server";

import { describeError } from "@/lib/helpers";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { db } from "@/db";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { Stock } from "@/db/schema/stock";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { eq, sql } from "drizzle-orm";

export type SupplierRevenueRow = {
  supplierName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  year: number | null;
  month: number | null;
  revenue: number;
  weightKg: number;
};

// Purchase turnover per supplier and invoice period. Revenue is the purchased
// value (stock lot valuation × invoiced quantity) — the same purchase-cost
// basis the finance reports use; weight is the invoiced quantity in kg.
export const getSupplierRevenue = async (): Promise<SupplierRevenueRow[]> => {
  try {
    const year = sql<number>`YEAR(${PurchaseInvoices.invoiceDate})`;
    const month = sql<number>`MONTH(${PurchaseInvoices.invoiceDate})`;

    // City and country are the supplier's visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

    const rows = await db
      .select({
        supplierName: Companies.companyName,
        supplierCode: Companies.id,
        city: visiting.city,
        country: visiting.country,
        year,
        month,
        revenue: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${PurchaseInvoiceItems.quantity}), 0)`,
        weightKg: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .innerJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
      .leftJoin(Stock, eq(PurchaseInvoiceItems.stockUuid, Stock.uuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .groupBy(
        Companies.uuid,
        Companies.companyName,
        Companies.id,
        visiting.city,
        visiting.country,
        year,
        month,
      )
      .orderBy(Companies.companyName);

    return rows.map((row) => ({
      supplierName: row.supplierName,
      supplierCode: row.supplierCode,
      city: row.city ?? null,
      country: row.country ?? null,
      year: row.year != null ? Number(row.year) : null,
      month: row.month != null ? Number(row.month) : null,
      revenue: Number(row.revenue),
      weightKg: Number(row.weightKg),
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch supplier revenue"));
  }
};
