"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { count, eq, min, sql } from "drizzle-orm";

export type CustomerRevenueSplitRow = {
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectContacts["city"] | null;
  country: SelectContacts["addressCountry"] | null;
  accountManager: SelectCompanies["accountManager"] | null;
  region: SelectCompanies["region"] | null;
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  orderType: string;
  year: number | null;
  month: number | null;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  invoiceLines: number;
};

// Order type is a set of boolean flags on the order, not a single column, so
// it's collapsed into a single label here (first matching flag wins).
const orderTypeLabel = sql<string>`CASE
  WHEN ${Orders.isConsignment} = 1 THEN 'Consignment'
  WHEN ${Orders.isIncidental} = 1 THEN 'Incidental'
  WHEN ${Orders.isInternalProduction} = 1 THEN 'Internal production'
  WHEN ${Orders.isCustomerMaterial} = 1 THEN 'Customer material'
  WHEN ${Orders.isPickup} = 1 THEN 'Pickup'
  ELSE 'Normal'
END`;

// Sales turnover per customer × revenue group × order type × invoice period.
export const getCustomerRevenueSplit = async (): Promise<
  CustomerRevenueSplitRow[]
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
        addressCountry: Contacts.addressCountry,
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
        country: primaryContact.addressCountry,
        accountManager: Companies.accountManager,
        region: Companies.region,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        orderType: orderTypeLabel,
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
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .innerJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .groupBy(
        Companies.uuid,
        Companies.representative,
        Companies.customerGroup,
        Companies.id,
        Companies.companyName,
        Companies.accountManager,
        Companies.region,
        primaryContact.city,
        primaryContact.addressCountry,
        RevenueGroups.uuid,
        RevenueGroups.number,
        RevenueGroups.name,
        orderTypeLabel,
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
        country: row.country ?? null,
        accountManager: row.accountManager,
        region: row.region,
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        orderType: row.orderType,
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
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue with split order types",
      ),
    );
  }
};
