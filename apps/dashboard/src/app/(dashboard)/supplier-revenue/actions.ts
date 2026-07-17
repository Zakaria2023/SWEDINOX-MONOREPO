"use server";

import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { db } from "@/db";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { Stock } from "@/db/schema/stock";
import { and, eq, min, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

export type SupplierRevenueRow = {
  supplierName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  city: SelectContacts["city"] | null;
  country: SelectContacts["addressCountry"] | null;
  year: number | null;
  month: number | null;
  revenue: number;
  weightKg: number;
};

// Purchase turnover per supplier and invoice period. Revenue is the purchased
// value (stock lot valuation × invoiced quantity) — the same purchase-cost
// basis the finance reports use; weight is the invoiced quantity in kg.
export const getSupplierRevenue = async (
  filter: PeriodFilter = {},
): Promise<SupplierRevenueRow[]> => {
  try {
    const year = sql<number>`YEAR(${PurchaseInvoices.invoiceDate})`;
    const month = sql<number>`MONTH(${PurchaseInvoices.invoiceDate})`;

    const primaryContactId = db
      .select({
        companyUuid: Contacts.companyUuid,
        minId: min(Contacts.id).as("min_id"),
      })
      .from(Contacts)
      .groupBy(Contacts.companyUuid)
      .as("primary_contact_id");

    const primaryContact = db
      .select({
        companyUuid: Contacts.companyUuid,
        city: Contacts.city,
        addressCountry: Contacts.addressCountry,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const rows = await db
      .select({
        supplierName: Companies.companyName,
        supplierCode: Companies.id,
        city: primaryContact.city,
        country: primaryContact.addressCountry,
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
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .where(
        and(
          filter.year ? eq(year, filter.year) : undefined,
          filter.month ? eq(month, filter.month) : undefined,
        ),
      )
      .groupBy(
        Companies.uuid,
        Companies.companyName,
        Companies.id,
        primaryContact.city,
        primaryContact.addressCountry,
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
  } catch {
    throw new Error("Failed to fetch supplier revenue");
  }
};
