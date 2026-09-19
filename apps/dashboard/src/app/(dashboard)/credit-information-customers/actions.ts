"use server";

import { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { Invoices } from "@/db/schema/invoices";
import { describeError, effectiveCreditLimit } from "@/lib/helpers";
import {
  getCommittedOrderValueByCompany,
  getOpenReceivablesByCompany,
} from "@/lib/server/credit-control";
import { eq, min, sql } from "drizzle-orm";

export type CreditInformationRow = {
  customerCode: SelectCompanies["id"];
  companyName: SelectCompanies["companyName"];
  city: SelectCompanyAddresses["city"] | null;
  initials: SelectContacts["initials"] | null;
  representative: SelectCompanies["representative"] | null;
  debtorNumber: SelectCompanies["debtorNumber"];
  paymentTerms: SelectCompanies["paymentTerms"] | null;
  /** Whether this debtor is sent payment reminders at all. True on 2.586 of
   *  the reference's 2.593 customers, so the seven exceptions are the point. */
  reminder: NonNullable<SelectCompanies["reminder"]>;
  creditLimit: number;
  creditLimitUninsured: number;
  creditInsurance: SelectCompanies["creditLimitInsurance"];
  creditInsuranceDate: SelectCompanies["insuranceValidUntil"];
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
  revenueThisYearExclVat: number;
  revenueLastYearExclVat: number;
  revenueTwoYearsAgoExclVat: number;
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
        initials: Contacts.initials,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    // The city is the company's visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

    const arStats = db
      .select({
        companyUuid: Invoices.companyUuid,
        oldestInvoiceDate: min(Invoices.invoiceDate).as("oldest_invoice_date"),
        oldestDueDate: min(Invoices.expirationDate).as("oldest_due_date"),
      })
      .from(Invoices)
      .where(sql`${Invoices.outstanding} > 0`)
      .groupBy(Invoices.companyUuid)
      .as("ar_stats");

    // Receivables and committed orders come from the same helpers the blocking
    // rule uses, so this screen's credit space is the figure an order is
    // actually held against rather than a second opinion.
    const [receivablesByCompany, committedByCompany] = await Promise.all([
      getOpenReceivablesByCompany(db),
      getCommittedOrderValueByCompany(db),
    ]);

    // The reference prints three years of revenue TWICE, once incl. VAT and
    // once excl. It is not one figure and a rate: on the 18-9-2026 export the
    // two sit at exactly 1,21 for domestic customers but at 1,00 for 110 of
    // the 290 with revenue — the export and reverse-charge ones, who are
    // invoiced no VAT at all. So both have to be summed, not one derived.
    const revenueFor = (y: number, col: string, amount: AnyMySqlColumn) =>
      sql<string>`COALESCE(SUM(CASE WHEN YEAR(${Invoices.invoiceDate}) = ${y} THEN ${amount} ELSE 0 END), 0)`.as(
        col,
      );

    const revenueStats = db
      .select({
        companyUuid: Invoices.companyUuid,
        thisYear: revenueFor(
          currentYear,
          "rev_this_year",
          Invoices.invoiceAmountInclVat,
        ),
        lastYear: revenueFor(
          currentYear - 1,
          "rev_last_year",
          Invoices.invoiceAmountInclVat,
        ),
        twoYearsAgo: revenueFor(
          currentYear - 2,
          "rev_two_years_ago",
          Invoices.invoiceAmountInclVat,
        ),
        thisYearExclVat: revenueFor(
          currentYear,
          "rev_this_year_excl",
          Invoices.invoiceAmountExclVat,
        ),
        lastYearExclVat: revenueFor(
          currentYear - 1,
          "rev_last_year_excl",
          Invoices.invoiceAmountExclVat,
        ),
        twoYearsAgoExclVat: revenueFor(
          currentYear - 2,
          "rev_two_years_ago_excl",
          Invoices.invoiceAmountExclVat,
        ),
      })
      .from(Invoices)
      .groupBy(Invoices.companyUuid)
      .as("revenue_stats");

    const rows = await db
      .select({
        customerCode: Companies.id,
        companyName: Companies.companyName,
        city: visiting.city,
        initials: primaryContact.initials,
        representative: Companies.representative,
        debtorNumber: Companies.debtorNumber,
        paymentTerms: Companies.paymentTerms,
        reminder: Companies.reminder,
        creditLimit: Companies.creditLimit,
        creditLimitUninsured: Companies.creditLimitUninsured,
        creditInsurance: Companies.creditLimitInsurance,
        creditInsuranceDate: Companies.insuranceValidUntil,
        creditLimitUninsuredDate: Companies.creditLimitUninsuredDate,
        companyUuid: Companies.uuid,
        oldestInvoiceDate: arStats.oldestInvoiceDate,
        oldestDueDate: arStats.oldestDueDate,
        blockedByUserId: Companies.blockedByUserId,
        vatNumber: Companies.vatNumber,
        revenueThisYear: revenueStats.thisYear,
        revenueLastYear: revenueStats.lastYear,
        revenueTwoYearsAgo: revenueStats.twoYearsAgo,
        revenueThisYearExclVat: revenueStats.thisYearExclVat,
        revenueLastYearExclVat: revenueStats.lastYearExclVat,
        revenueTwoYearsAgoExclVat: revenueStats.twoYearsAgoExclVat,
      })
      .from(Companies)
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .leftJoin(arStats, eq(Companies.uuid, arStats.companyUuid))
      .leftJoin(revenueStats, eq(Companies.uuid, revenueStats.companyUuid))
      .where(sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`)
      .orderBy(sql`${Companies.id} asc`);

    return rows.map((row) => {
      const creditLimit = Number(row.creditLimit ?? 0);
      const outstanding = receivablesByCompany.get(row.companyUuid) ?? 0;
      const currentOrders = committedByCompany.get(row.companyUuid) ?? 0;
      return {
        customerCode: row.customerCode,
        companyName: row.companyName,
        city: row.city ?? null,
        initials: row.initials ?? null,
        representative: row.representative,
        debtorNumber: row.debtorNumber,
        paymentTerms: row.paymentTerms,
        reminder: row.reminder ?? false,
        creditLimit,
        creditLimitUninsured: Number(row.creditLimitUninsured ?? 0),
        creditInsurance: row.creditInsurance,
        creditInsuranceDate: row.creditInsuranceDate,
        outstanding,
        currentOrders,
        // Both limits, not just the insured one, and the uninsured one only
        // while it is still valid. 187 of the reference's 2.593 customers have
        // no insured limit at all and trade entirely on the uninsured one.
        creditSpace:
          effectiveCreditLimit(
            creditLimit,
            Number(row.creditLimitUninsured ?? 0),
            // The uninsured limit lapses on its own date, not the policy's.
            row.creditLimitUninsuredDate ?? null,
          ) -
          outstanding -
          currentOrders,
        oldestInvoiceDate: row.oldestInvoiceDate,
        oldestDueDate: row.oldestDueDate,
        blocked: row.blockedByUserId !== null,
        vatNumber: row.vatNumber,
        revenueThisYear: Number(row.revenueThisYear ?? 0),
        revenueLastYear: Number(row.revenueLastYear ?? 0),
        revenueTwoYearsAgo: Number(row.revenueTwoYearsAgo ?? 0),
        revenueThisYearExclVat: Number(row.revenueThisYearExclVat ?? 0),
        revenueLastYearExclVat: Number(row.revenueLastYearExclVat ?? 0),
        revenueTwoYearsAgoExclVat: Number(row.revenueTwoYearsAgoExclVat ?? 0),
      };
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch credit information customers"),
    );
  }
};
