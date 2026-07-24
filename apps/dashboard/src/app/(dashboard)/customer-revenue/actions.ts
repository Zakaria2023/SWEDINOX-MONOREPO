"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Stock } from "@/db/schema/stock";
import { and, eq, min, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

export type CustomerRevenueRow = {
  customerName: SelectCompanies["companyName"] | null;
  customerCode: SelectCompanies["id"] | null;
  city: SelectContacts["city"] | null;
  country: SelectContacts["addressCountry"] | null;
  year: number | null;
  month: number | null;
  revenue: number;
  weightKg: number;
  profit: number;
  profitMargin: number;
};

// Sales turnover per customer and invoice period. Revenue is the invoiced
// order-line amount; cost comes from the stock lot's valuation price, so
// profit/margin match the finance reports. Weight is the planned kg invoiced.
export const getCustomerRevenue = async (
  filter: PeriodFilter = {},
): Promise<CustomerRevenueRow[]> => {
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
        addressCountry: Contacts.addressCountry,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const rows = await db
      .select({
        customerName: Companies.companyName,
        customerCode: Companies.id,
        city: primaryContact.city,
        country: primaryContact.addressCountry,
        year,
        month,
        revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${OrderItems.quantity}), 0)`,
        weightKg: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
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
        Companies.companyName,
        Companies.id,
        primaryContact.city,
        primaryContact.addressCountry,
        year,
        month,
      )
      .orderBy(Companies.companyName);

    return rows.map((row) => {
      const revenue = Number(row.revenue);
      const profit = revenue - Number(row.cost);
      return {
        customerName: row.customerName,
        customerCode: row.customerCode,
        city: row.city ?? null,
        country: row.country ?? null,
        year: row.year != null ? Number(row.year) : null,
        month: row.month != null ? Number(row.month) : null,
        revenue,
        weightKg: Number(row.weightKg),
        profit,
        profitMargin: revenue === 0 ? 0 : (profit / revenue) * 100,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch customer revenue"));
  }
};
