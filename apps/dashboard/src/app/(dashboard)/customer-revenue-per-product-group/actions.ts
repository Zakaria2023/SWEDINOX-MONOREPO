"use server";

import { describeError, profitMarginPercent } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products } from "@/db/schema/products";
import { count, eq, min, sql } from "drizzle-orm";

export type CustomerRevenuePerProductGroupRow = {
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectContacts["city"] | null;
  productGroupName: SelectProductGroups["name"] | null;
  region: SelectCompanies["region"] | null;
  year: number | null;
  month: number | null;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  invoiceLines: number;
};

// Sales turnover per customer × product group × invoice period, read from the
// invoice line's own snapshot of revenue, cost and weight.
export const getCustomerRevenuePerProductGroup = async (): Promise<
  CustomerRevenuePerProductGroupRow[]
> => {
  try {
    const year = sql<number>`YEAR(${Invoices.invoiceDate})`;
    const month = sql<number>`MONTH(${Invoices.invoiceDate})`;

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
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const rows = await db
      .select({
        representative: Companies.representative,
        customerGroup: Companies.customerGroup,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        city: primaryContact.city,
        region: Companies.region,
        productGroupName: ProductGroups.name,
        year,
        month,
        // The invoice line's own snapshot — see revenue-per-revenue-group.
        weightKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${InvoiceItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${InvoiceItems.costAmount}), 0)`,
        invoiceLines: count(InvoiceItems.uuid),
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .innerJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .groupBy(
        Companies.uuid,
        Companies.representative,
        Companies.customerGroup,
        Companies.id,
        Companies.companyName,
        Companies.region,
        primaryContact.city,
        ProductGroups.uuid,
        ProductGroups.name,
        year,
        month,
      )
      .orderBy(Companies.companyName);

    return rows.map((row) => {
      const revenue = Number(row.revenue);
      const profit = revenue - Number(row.cost);
      return {
        representative: row.representative,
        customerGroup: row.customerGroup,
        customerCode: row.customerCode,
        customerName: row.customerName,
        city: row.city ?? null,
        region: row.region,
        productGroupName: row.productGroupName,
        year: row.year != null ? Number(row.year) : null,
        month: row.month != null ? Number(row.month) : null,
        weightKg: Number(row.weightKg),
        revenue,
        profit,
        profitMargin: profitMarginPercent(revenue, profit),
        invoiceLines: Number(row.invoiceLines),
      };
    });
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue per product group",
      ),
    );
  }
};
