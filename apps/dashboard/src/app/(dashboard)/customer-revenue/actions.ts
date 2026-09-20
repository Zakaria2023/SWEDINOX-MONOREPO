"use server";

import { db } from "@/db";
import { SelectCompanies } from "@/db/schema/companies";
import { Invoices } from "@/db/schema/invoices";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { CUSTOMER_REVENUE_COLUMNS } from "@/app/(dashboard)/customer-revenue/columns";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import { eq, sql } from "drizzle-orm";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  getContactCounters,
  getInvoiceCountsByCompanyMonth,
  getRevenueCompanies,
  getRevenueFacts,
} from "@/lib/server/customer-revenue";

export type CustomerRevenueRow = {
  customerName: SelectCompanies["companyName"] | null;
  customerCode: SelectCompanies["id"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  region: SelectCompanies["region"] | null;
  representative: SelectCompanies["representative"] | null;
  accountManager: SelectCompanies["accountManager"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  /** The company's free-text remark, which the reference prints here too. */
  pointOfAttention: SelectCompanies["remarks"];
  active: boolean;
  lastOrderDate: Date | null;
  lastCallDate: string | null;
  lastVisitDate: string | null;
  calledThisYear: number;
  visitsThisYear: number;
  year: number;
  month: number;
  materialRevenue: number;
  optionsRevenue: number;
  surchargesRevenue: number;
  revenue: number;
  materialProfit: number;
  optionsProfit: number;
  surchargesProfit: number;
  profit: number;
  profitMargin: number;
  weightKg: number;
  invoices: number;
  invoiceLines: number;
};

// Invoiced revenue per customer and month, split the way the reference's C8
// splits it: material, options and surcharges, each with its profit. Proved on
// May 2025 — material and options exact on 90 of 90 customers. `#Invoice lines`
// counts order lines only, and kilos are whole kilos, as the reference prints
// them. `Active` is the company's archive flag.
const customerRevenueRows = async (): Promise<CustomerRevenueRow[]> => {
  try {
    // Sequential rather than concurrent: this database caps connections.
    const facts = await getRevenueFacts();
    const companies = await getRevenueCompanies();
    const invoiceCounts = await getInvoiceCountsByCompanyMonth();
    const contact = await getContactCounters();

    const rows = new Map<string, CustomerRevenueRow>();
    for (const fact of facts) {
      const key = `${fact.companyUuid}|${fact.year}|${fact.month}`;
      const company = companies.get(fact.companyUuid);
      const row = rows.get(key) ?? {
        customerName: company?.companyName ?? null,
        customerCode: company?.id ?? null,
        city: company?.city ?? null,
        country: company?.country ?? null,
        region: company?.region ?? null,
        representative: company?.representative ?? null,
        accountManager: company?.accountManager ?? null,
        customerGroup: company?.customerGroup ?? null,
        pointOfAttention: company?.remarks ?? null,
        active: !company?.isInactive,
        lastOrderDate: contact.get(fact.companyUuid)?.lastOrderDate ?? null,
        lastCallDate: contact.get(fact.companyUuid)?.lastCallDate ?? null,
        lastVisitDate: contact.get(fact.companyUuid)?.lastVisitDate ?? null,
        calledThisYear: contact.get(fact.companyUuid)?.calledThisYear ?? 0,
        visitsThisYear: contact.get(fact.companyUuid)?.visitsThisYear ?? 0,
        year: fact.year,
        month: fact.month,
        materialRevenue: 0,
        optionsRevenue: 0,
        surchargesRevenue: 0,
        revenue: 0,
        materialProfit: 0,
        optionsProfit: 0,
        surchargesProfit: 0,
        profit: 0,
        profitMargin: 0,
        weightKg: 0,
        invoices: invoiceCounts.get(key) ?? 0,
        invoiceLines: 0,
      };
      if (fact.kind === "product") {
        row.materialRevenue += fact.revenue;
        row.materialProfit += fact.profit;
        // The option money comes from the product row, where it is the
        // invoice's own `Revenue options`. The separate `option` facts carry
        // the same money split by the option's revenue group, which this
        // screen does not report -- counting both would double it.
        row.optionsRevenue += fact.optionRevenue;
        row.optionsProfit += fact.optionProfit;
        row.weightKg += fact.weightKg;
        row.invoiceLines += fact.lines;
      } else if (fact.kind === "charge") {
        row.surchargesRevenue += fact.revenue;
        row.surchargesProfit += fact.profit;
      }
      rows.set(key, row);
    }

    return [...rows.values()]
      .map((row) => {
        const revenue =
          row.materialRevenue + row.optionsRevenue + row.surchargesRevenue;
        const profit =
          row.materialProfit + row.optionsProfit + row.surchargesProfit;
        return {
          ...row,
          revenue,
          profit,
          profitMargin: profitMarginPercent(revenue, profit),
          weightKg: Math.round(row.weightKg),
        };
      })
      .sort(
        (a, b) =>
          (a.customerName ?? "").localeCompare(b.customerName ?? "") ||
          b.year - a.year ||
          b.month - a.month,
      );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch customer revenue"));
  }
};

/**
 * One row per customer per invoiced month.
 *
 * ⚠️ The reference shows one row per customer and reads its period off a
 * `Year` / `Month` filter — and with Year 2025 / Month 5 its `… this year`
 * columns hold **May 2025 only**, not January to May. The month is a column
 * here rather than a hidden setting, and the same filter narrows to one; the
 * numbers are the reference's, the shape says out loud which period they are.
 */
const filteredRows = async (
  query: TableQuery,
): Promise<CustomerRevenueRow[]> => {
  const all = await customerRevenueRows();

  const term = query.q?.toLowerCase() ?? null;
  const years = query.filters.year ?? [];
  const months = query.filters.month ?? [];
  const representatives = query.filters.representative ?? [];
  const active = query.filters.active ?? [];

  return all.filter((row) => {
    if (term && !(row.customerName ?? "").toLowerCase().includes(term)) {
      return false;
    }
    if (years.length > 0 && !years.includes(String(row.year))) {
      return false;
    }
    if (months.length > 0 && !months.includes(String(row.month))) {
      return false;
    }
    if (
      representatives.length > 0 &&
      !representatives.includes(row.representative ?? "")
    ) {
      return false;
    }
    if (active.includes("yes") && !row.active) {
      return false;
    }
    if (active.includes("no") && row.active) {
      return false;
    }
    return true;
  });
};

export const getCustomerRevenue = async (
  query: TableQuery = parseTableQuery({}),
): Promise<Paged<CustomerRevenueRow>> => {
  const rows = await filteredRows(query);
  const start = (query.page - 1) * query.pageSize;

  return {
    rows: rows.slice(start, start + query.pageSize),
    total: rows.length,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const exportCustomerRevenue = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await filteredRows(parseTableQuery(params));

  return exportRows({
    name: "Customer revenue",
    columns: CUSTOMER_REVENUE_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};

/**
 * The invoiced years, for the period filter.
 *
 * Read straight off the invoices rather than from the rows: building the whole
 * fact set a second time to learn which years exist doubled the work of every
 * page render, on a database that caps connections.
 */
export const getCustomerRevenueYears = async (): Promise<number[]> => {
  const rows = await db
    .selectDistinct({ year: sql<number>`YEAR(${Invoices.invoiceDate})` })
    .from(Invoices)
    .where(eq(Invoices.cancelled, false));

  return rows
    .map((row) => Number(row.year))
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => b - a);
};
