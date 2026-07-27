"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { eq, min, sql } from "drizzle-orm";

export type CreditInformationRow = {
  customerCode: SelectCompanies["id"];
  companyName: SelectCompanies["companyName"];
  city: SelectContacts["city"] | null;
  initials: SelectContacts["initials"] | null;
  representative: SelectCompanies["representative"] | null;
  paymentTerms: SelectCompanies["paymentTerms"] | null;
  creditLimit: number;
  creditLimitUninsured: number;
  creditInsurance: number;
  creditInsuranceDate: string | Date | null;
  outstanding: number;
  currentOrders: number;
  creditSpace: number;
  oldestInvoiceDate: string | Date | null;
  oldestDueDate: string | Date | null;
  blocked: boolean;
  vatNumber: SelectCompanies["vatNumber"] | null;
  revenueThisYear: number;
  revenueLastYear: number;
  revenueTwoYearsAgo: number;
};

// Per-customer credit picture: limits and insurance, open receivables, current
// order value, remaining credit space, ageing markers and 3-year revenue.
export const getCreditInformationCustomers = async (
  currentYear: number = new Date().getFullYear(),
): Promise<CreditInformationRow[]> => {
  try {
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
        initials: Contacts.initials,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const arStats = db
      .select({
        companyUuid: Invoices.companyUuid,
        outstanding: sql<string>`COALESCE(SUM(${Invoices.outstanding}), 0)`.as(
          "ar_outstanding",
        ),
        oldestInvoiceDate: min(Invoices.invoiceDate).as("oldest_invoice_date"),
        oldestDueDate: min(Invoices.expirationDate).as("oldest_due_date"),
      })
      .from(Invoices)
      .where(sql`${Invoices.outstanding} > 0`)
      .groupBy(Invoices.companyUuid)
      .as("ar_stats");

    const orderStats = db
      .select({
        companyUuid: Orders.companyUuid,
        currentOrders: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`.as(
          "current_orders",
        ),
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .groupBy(Orders.companyUuid)
      .as("order_stats");

    const revenueFor = (y: number, col: string) =>
      sql<string>`COALESCE(SUM(CASE WHEN YEAR(${Invoices.invoiceDate}) = ${y} THEN ${Invoices.invoiceAmountInclVat} ELSE 0 END), 0)`.as(
        col,
      );

    const revenueStats = db
      .select({
        companyUuid: Invoices.companyUuid,
        thisYear: revenueFor(currentYear, "rev_this_year"),
        lastYear: revenueFor(currentYear - 1, "rev_last_year"),
        twoYearsAgo: revenueFor(currentYear - 2, "rev_two_years_ago"),
      })
      .from(Invoices)
      .groupBy(Invoices.companyUuid)
      .as("revenue_stats");

    const rows = await db
      .select({
        customerCode: Companies.id,
        companyName: Companies.companyName,
        city: primaryContact.city,
        initials: primaryContact.initials,
        representative: Companies.representative,
        paymentTerms: Companies.paymentTerms,
        creditLimit: Companies.creditLimit,
        creditLimitUninsured: Companies.creditLimitUninsured,
        creditInsurance: Companies.creditLimitInsurance,
        creditInsuranceDate: Companies.creditLimitUninsuredDate,
        outstanding: arStats.outstanding,
        oldestInvoiceDate: arStats.oldestInvoiceDate,
        oldestDueDate: arStats.oldestDueDate,
        currentOrders: orderStats.currentOrders,
        blockedByUserId: Companies.blockedByUserId,
        vatNumber: Companies.vatNumber,
        revenueThisYear: revenueStats.thisYear,
        revenueLastYear: revenueStats.lastYear,
        revenueTwoYearsAgo: revenueStats.twoYearsAgo,
      })
      .from(Companies)
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(arStats, eq(Companies.uuid, arStats.companyUuid))
      .leftJoin(orderStats, eq(Companies.uuid, orderStats.companyUuid))
      .leftJoin(revenueStats, eq(Companies.uuid, revenueStats.companyUuid))
      .where(sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`)
      .orderBy(sql`${Companies.id} asc`);

    return rows.map((row) => {
      const creditLimit = Number(row.creditLimit ?? 0);
      const outstanding = Number(row.outstanding ?? 0);
      const currentOrders = Number(row.currentOrders ?? 0);
      return {
        customerCode: row.customerCode,
        companyName: row.companyName,
        city: row.city ?? null,
        initials: row.initials ?? null,
        representative: row.representative,
        paymentTerms: row.paymentTerms,
        creditLimit,
        creditLimitUninsured: Number(row.creditLimitUninsured ?? 0),
        creditInsurance: Number(row.creditInsurance ?? 0),
        creditInsuranceDate: row.creditInsuranceDate,
        outstanding,
        currentOrders,
        creditSpace: creditLimit - outstanding - currentOrders,
        oldestInvoiceDate: row.oldestInvoiceDate,
        oldestDueDate: row.oldestDueDate,
        blocked: row.blockedByUserId !== null,
        vatNumber: row.vatNumber,
        revenueThisYear: Number(row.revenueThisYear ?? 0),
        revenueLastYear: Number(row.revenueLastYear ?? 0),
        revenueTwoYearsAgo: Number(row.revenueTwoYearsAgo ?? 0),
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch credit information customers"));
  }
};
