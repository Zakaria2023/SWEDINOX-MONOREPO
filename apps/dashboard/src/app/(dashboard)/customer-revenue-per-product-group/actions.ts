"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { and, count, eq, min, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

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

// Sales turnover per customer × product group × invoice period. Revenue is the
// invoiced amount; cost from the stock lot valuation drives profit/margin.
export const getCustomerRevenuePerProductGroup = async (
  filter: PeriodFilter = {},
): Promise<CustomerRevenuePerProductGroupRow[]> => {
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
        weightKg: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${OrderItems.quantity}), 0)`,
        invoiceLines: count(InvoiceItems.uuid),
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .innerJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .where(
        and(
          filter.year ? eq(year, filter.year) : undefined,
          filter.month ? eq(month, filter.month) : undefined,
        ),
      )
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
        profitMargin: revenue === 0 ? 0 : (profit / revenue) * 100,
        invoiceLines: Number(row.invoiceLines),
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch customer revenue per product group"));
  }
};
