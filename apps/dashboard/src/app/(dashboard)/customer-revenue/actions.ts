"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { eq, min, sql } from "drizzle-orm";

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

// Sales turnover per customer and invoice period, read from the invoice line's
// own snapshot of revenue, cost and weight. Those were fixed when the invoice
// was raised, so the figures agree with the other finance reports and a past
// period's margin cannot shift when stock is revalued.
export const getCustomerRevenue = async (): Promise<CustomerRevenueRow[]> => {
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
        revenue: sql<string>`COALESCE(SUM(${InvoiceItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${InvoiceItems.costAmount}), 0)`,
        weightKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
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
