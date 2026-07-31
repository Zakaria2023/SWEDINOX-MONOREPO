"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { eq, min, sql } from "drizzle-orm";

export type CustomerRevenueSalesVisitsRow = {
  representative: SelectCompanies["representative"] | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  visitPostalCode: SelectContacts["visitPostalCode"] | null;
  visitCity: SelectContacts["visitCity"] | null;
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  currentYear: number;
  revenueCurrentYear: number;
  revenueLastYear: number;
  revenueTwoYearsAgo: number;
  kgCurrentYear: number;
  kgLastYear: number;
  kgTwoYearsAgo: number;
};

// Three-year sales comparison per customer × revenue group, plus the visit
// address. Years are computed relative to `currentYear` (defaults to now).
export const getCustomerRevenueSalesVisits = async (
  currentYear: number = new Date().getFullYear(),
): Promise<CustomerRevenueSalesVisitsRow[]> => {
  try {
    const invoiceYear = sql`YEAR(${Invoices.invoiceDate})`;
    // Both read the invoice line's own snapshot — see revenue-per-revenue-group.
    // A year-on-year comparison in particular must not shift as older orders
    // are re-priced.
    const revenueFor = (y: number) =>
      sql<string>`COALESCE(SUM(CASE WHEN ${invoiceYear} = ${y} THEN ${InvoiceItems.amount} ELSE 0 END), 0)`;
    const kgFor = (y: number) =>
      sql<string>`COALESCE(SUM(CASE WHEN ${invoiceYear} = ${y} THEN ${InvoiceItems.weightKg} ELSE 0 END), 0)`;

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
        visitPostalCode: Contacts.visitPostalCode,
        visitCity: Contacts.visitCity,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const rows = await db
      .select({
        representative: Companies.representative,
        companyCode: Companies.id,
        companyName: Companies.companyName,
        visitPostalCode: primaryContact.visitPostalCode,
        visitCity: primaryContact.visitCity,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        revenueCurrentYear: revenueFor(currentYear),
        revenueLastYear: revenueFor(currentYear - 1),
        revenueTwoYearsAgo: revenueFor(currentYear - 2),
        kgCurrentYear: kgFor(currentYear),
        kgLastYear: kgFor(currentYear - 1),
        kgTwoYearsAgo: kgFor(currentYear - 2),
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .innerJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .groupBy(
        Companies.uuid,
        Companies.representative,
        Companies.id,
        Companies.companyName,
        primaryContact.visitPostalCode,
        primaryContact.visitCity,
        RevenueGroups.uuid,
        RevenueGroups.number,
        RevenueGroups.name,
      )
      .orderBy(Companies.companyName);

    return rows.map((row) => ({
      representative: row.representative,
      companyCode: row.companyCode,
      companyName: row.companyName,
      visitPostalCode: row.visitPostalCode ?? null,
      visitCity: row.visitCity ?? null,
      revenueGroupNumber: row.revenueGroupNumber,
      revenueGroupName: row.revenueGroupName,
      currentYear,
      revenueCurrentYear: Number(row.revenueCurrentYear),
      revenueLastYear: Number(row.revenueLastYear),
      revenueTwoYearsAgo: Number(row.revenueTwoYearsAgo),
      kgCurrentYear: Number(row.kgCurrentYear),
      kgLastYear: Number(row.kgLastYear),
      kgTwoYearsAgo: Number(row.kgTwoYearsAgo),
    }));
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue, sales and visits",
      ),
    );
  }
};
