"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { and, eq, min, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

export type CustomerRevenuePerRevenueGroupRow = {
  customerName: SelectCompanies["companyName"] | null;
  customerCode: SelectCompanies["id"] | null;
  city: SelectContacts["city"] | null;
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  year: number | null;
  month: number | null;
  weightKg: number;
  revenue: number;
};

// Sales turnover per customer × revenue group × invoice period, rolled up from
// invoiced order lines. Revenue is the invoiced amount, weight the planned kg.
export const getCustomerRevenuePerRevenueGroup = async (
  filter: PeriodFilter = {},
): Promise<CustomerRevenuePerRevenueGroupRow[]> => {
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
        customerName: Companies.companyName,
        customerCode: Companies.id,
        city: primaryContact.city,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        year,
        month,
        weightKg: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .innerJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
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
        RevenueGroups.uuid,
        RevenueGroups.number,
        RevenueGroups.name,
        year,
        month,
      )
      .orderBy(Companies.companyName);

    return rows.map((row) => ({
      customerName: row.customerName,
      customerCode: row.customerCode,
      city: row.city ?? null,
      revenueGroupNumber: row.revenueGroupNumber,
      revenueGroupName: row.revenueGroupName,
      year: row.year != null ? Number(row.year) : null,
      month: row.month != null ? Number(row.month) : null,
      weightKg: Number(row.weightKg),
      revenue: Number(row.revenue),
    }));
  } catch {
    throw new Error("Failed to fetch customer revenue per revenue group");
  }
};
