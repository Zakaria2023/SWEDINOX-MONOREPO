"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Invoices } from "@/db/schema/invoices";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectVisitReports, VisitReports } from "@/db/schema/visit-reports";
import { CUSTOMER_REVENUE_COLUMNS } from "@/app/(dashboard)/customer-revenue/columns";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import { alias } from "drizzle-orm/mysql-core";
import { desc, eq, sql } from "drizzle-orm";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  getCompetitorShares,
  getContactCounters,
  getInvoiceCountsByCompanyMonth,
  getRevenueCompanies,
  getRevenueFacts,
  RevenueFact,
} from "@/lib/server/customer-revenue";

const PurchaseOrg = alias(Companies, "purchase_org");

const IS_CUSTOMER = sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`;

/** One period's money, split the way the reference splits it. */
export type CustomerRevenueFigures = {
  materialRevenue: number;
  optionsRevenue: number;
  surchargesRevenue: number;
  revenue: number;
  materialProfit: number;
  optionsProfit: number;
  surchargesProfit: number;
  profit: number;
  profitMargin: number;
  materialMargin: number;
  optionsMargin: number;
  surchargesMargin: number;
  /** Whole kilos, the way the reference prints them. */
  weightKg: number;
  invoices: number;
  /** Order lines only: the reference does not count surcharge lines here. */
  invoiceLines: number;
};

export type CustomerRevenuePeriod = {
  year: number;
  month: number;
};

export type CustomerRevenueRow = {
  companyUuid: SelectCompanies["uuid"];
  customerName: SelectCompanies["companyName"];
  customerCode: SelectCompanies["id"];
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  region: SelectCompanies["region"];
  representative: SelectCompanies["representative"];
  accountManager: SelectCompanies["accountManager"];
  customerGroup: SelectCompanies["customerGroup"];
  classification: SelectCompanies["classification"];
  targetAnnualRevenue: SelectCompanies["targetAnnualRevenue"];
  potentialAnnualRevenue: SelectCompanies["potentialAnnualRevenue"];
  targetAnnualSales: SelectCompanies["targetAnnualSales"];
  potentialAnnualSales: SelectCompanies["potentialAnnualSales"];
  visitFrequency: SelectCompanies["visitFrequency"];
  callFrequency: SelectCompanies["callFrequencyPerYear"];
  employees: SelectCompanies["numberOfEmployees"];
  purchaseOrgCode: SelectCompanies["id"] | null;
  purchaseOrgName: SelectCompanies["companyName"] | null;
  memberNumberPurchaseOrg: SelectCompanies["memberNumberPurchaseOrg"];
  /** The company's free-text remark, which the reference prints here too. */
  pointOfAttention: SelectCompanies["remarks"];
  active: boolean;
  /** `Firm (share %)` for every competitor on the customer. */
  competitors: string | null;
  latestVisitReport: SelectVisitReports["remarks"] | null;
  lastOrderDate: Date | null;
  lastCallDate: string | null;
  lastVisitDate: string | null;
  calledThisYear: number;
  visitsThisYear: number;
  /** The selected period, which every `… this year` column reports. */
  year: number;
  month: number;
  thisPeriod: CustomerRevenueFigures;
  /** The same month a year earlier. */
  lastYear: CustomerRevenueFigures;
  /** The month before the selected one. */
  lastMonth: CustomerRevenueFigures;
  /** Revenue against the same month last year, in percent. */
  trend: number | null;
};

const emptyFigures = (): CustomerRevenueFigures => ({
  materialRevenue: 0,
  optionsRevenue: 0,
  surchargesRevenue: 0,
  revenue: 0,
  materialProfit: 0,
  optionsProfit: 0,
  surchargesProfit: 0,
  profit: 0,
  profitMargin: 0,
  materialMargin: 0,
  optionsMargin: 0,
  surchargesMargin: 0,
  weightKg: 0,
  invoices: 0,
  invoiceLines: 0,
});

const periodKey = (companyUuid: string, year: number, month: number) =>
  `${companyUuid}|${year}|${month}`;

const previousMonth = ({ year, month }: CustomerRevenuePeriod) =>
  month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

// Material, options and surcharges per company and month, from the same facts
// the revenue-group screens read. Proved on May 2025 — material and options
// exact on 90 of 90 customers.
const figuresByCompanyMonth = (
  facts: RevenueFact[],
  invoiceCounts: Map<string, number>,
): Map<string, CustomerRevenueFigures> => {
  const held = new Map<string, CustomerRevenueFigures>();
  for (const fact of facts) {
    const key = periodKey(fact.companyUuid, fact.year, fact.month);
    const figures = held.get(key) ?? {
      ...emptyFigures(),
      invoices: invoiceCounts.get(key) ?? 0,
    };
    if (fact.kind === "product") {
      figures.materialRevenue += fact.revenue;
      figures.materialProfit += fact.profit;
      // The option money comes from the product row, where it is the
      // invoice's own `Revenue options`. The separate `option` facts carry
      // the same money split by the option's revenue group, which this
      // screen does not report -- counting both would double it.
      figures.optionsRevenue += fact.optionRevenue;
      figures.optionsProfit += fact.optionProfit;
      figures.weightKg += fact.weightKg;
      figures.invoiceLines += fact.lines;
    } else if (fact.kind === "charge") {
      figures.surchargesRevenue += fact.revenue;
      figures.surchargesProfit += fact.profit;
    }
    held.set(key, figures);
  }

  for (const figures of held.values()) {
    figures.revenue =
      figures.materialRevenue + figures.optionsRevenue + figures.surchargesRevenue;
    figures.profit =
      figures.materialProfit + figures.optionsProfit + figures.surchargesProfit;
    figures.profitMargin = profitMarginPercent(figures.revenue, figures.profit);
    figures.materialMargin = profitMarginPercent(
      figures.materialRevenue,
      figures.materialProfit,
    );
    figures.optionsMargin = profitMarginPercent(
      figures.optionsRevenue,
      figures.optionsProfit,
    );
    figures.surchargesMargin = profitMarginPercent(
      figures.surchargesRevenue,
      figures.surchargesProfit,
    );
    figures.weightKg = Math.round(figures.weightKg);
  }

  return held;
};

/**
 * The period the screen reports.
 *
 * The reference takes one `Year` and one `Month` and its `… this year` columns
 * then hold **that month only** (Year 2025 / Month 5 → May 2025, exact on 90
 * of 90 customers). Left blank, it reads the current year — and a first
 * capture came out all zeros that way. Here a blank year or month falls back
 * to the latest month anything was invoiced in, so the screen opens on figures.
 */
const resolvePeriod = (
  facts: RevenueFact[],
  query: TableQuery,
): CustomerRevenuePeriod => {
  const chosenYear = Number(query.filters.year?.[0] ?? Number.NaN);
  const chosenMonth = Number(query.filters.month?.[0] ?? Number.NaN);
  const today = new Date();

  const invoiced = facts
    .filter((fact) => !Number.isFinite(chosenYear) || fact.year === chosenYear)
    .map((fact) => fact.year * 12 + (fact.month - 1));
  const latest = invoiced.length > 0 ? Math.max(...invoiced) : null;

  const year = Number.isFinite(chosenYear)
    ? chosenYear
    : latest === null
      ? today.getFullYear()
      : Math.floor(latest / 12);
  const month = Number.isFinite(chosenMonth)
    ? chosenMonth
    : latest === null
      ? today.getMonth() + 1
      : (latest % 12) + 1;

  return { year, month };
};

/**
 * One row per customer, sold to or not — the reference lists all 1 724 of its
 * customers, 1 634 of them with nothing in the month.
 */
const customerRevenueRows = async (
  query: TableQuery,
): Promise<CustomerRevenueRow[]> => {
  try {
    // Sequential rather than concurrent: this database caps connections.
    const facts = await getRevenueFacts();
    const period = resolvePeriod(facts, query);
    const addresses = await getRevenueCompanies();
    const invoiceCounts = await getInvoiceCountsByCompanyMonth();
    const contact = await getContactCounters(period.year);

    const customers = await db
      .select({
        uuid: Companies.uuid,
        id: Companies.id,
        companyName: Companies.companyName,
        isCustomer: sql<number>`${IS_CUSTOMER}`,
        representative: Companies.representative,
        accountManager: Companies.accountManager,
        customerGroup: Companies.customerGroup,
        region: Companies.region,
        classification: Companies.classification,
        targetAnnualRevenue: Companies.targetAnnualRevenue,
        potentialAnnualRevenue: Companies.potentialAnnualRevenue,
        targetAnnualSales: Companies.targetAnnualSales,
        potentialAnnualSales: Companies.potentialAnnualSales,
        visitFrequency: Companies.visitFrequency,
        callFrequency: Companies.callFrequencyPerYear,
        employees: Companies.numberOfEmployees,
        purchaseOrgCode: PurchaseOrg.id,
        purchaseOrgName: PurchaseOrg.companyName,
        memberNumberPurchaseOrg: Companies.memberNumberPurchaseOrg,
        remarks: Companies.remarks,
        isInactive: Companies.isInactive,
      })
      .from(Companies)
      .leftJoin(PurchaseOrg, eq(Companies.purchaseOrgCompanyUuid, PurchaseOrg.uuid));

    const competitors = await getCompetitorShares();

    // The newest report per company. `Latest visit report` is empty on all
    // 1 724 reference rows, so what it prints is reasoned: the report's text,
    // beside `Last visit date` which already gives its date.
    const reportRows = await db
      .select({
        companyUuid: VisitReports.companyUuid,
        remarks: VisitReports.remarks,
      })
      .from(VisitReports)
      .orderBy(desc(VisitReports.visitDate), desc(VisitReports.id));
    const latestReports = new Map<string, string | null>();
    for (const row of reportRows) {
      if (!latestReports.has(row.companyUuid)) {
        latestReports.set(row.companyUuid, row.remarks);
      }
    }

    const figures = figuresByCompanyMonth(facts, invoiceCounts);
    const before = previousMonth(period);
    const figuresFor = (uuid: string, year: number, month: number) =>
      figures.get(periodKey(uuid, year, month)) ?? emptyFigures();

    return customers
      .filter(
        (company) =>
          Number(company.isCustomer) === 1 ||
          figures.has(periodKey(company.uuid, period.year, period.month)),
      )
      .map((company): CustomerRevenueRow => {
        const thisPeriod = figuresFor(company.uuid, period.year, period.month);
        const lastYear = figuresFor(company.uuid, period.year - 1, period.month);
        const lastMonth = figuresFor(company.uuid, before.year, before.month);
        const address = addresses.get(company.uuid);
        const counters = contact.get(company.uuid);
        return {
          companyUuid: company.uuid,
          customerName: company.companyName,
          customerCode: company.id,
          city: address?.city ?? null,
          country: address?.country ?? null,
          region: company.region,
          representative: company.representative,
          accountManager: company.accountManager,
          customerGroup: company.customerGroup,
          classification: company.classification,
          targetAnnualRevenue: company.targetAnnualRevenue,
          potentialAnnualRevenue: company.potentialAnnualRevenue,
          targetAnnualSales: company.targetAnnualSales,
          potentialAnnualSales: company.potentialAnnualSales,
          visitFrequency: company.visitFrequency,
          callFrequency: company.callFrequency,
          employees: company.employees,
          purchaseOrgCode: company.purchaseOrgCode,
          purchaseOrgName: company.purchaseOrgName,
          memberNumberPurchaseOrg: company.memberNumberPurchaseOrg,
          pointOfAttention: company.remarks,
          active: !company.isInactive,
          competitors: competitors.get(company.uuid) ?? null,
          latestVisitReport: latestReports.get(company.uuid) ?? null,
          lastOrderDate: counters?.lastOrderDate ?? null,
          lastCallDate: counters?.lastCallDate ?? null,
          lastVisitDate: counters?.lastVisitDate ?? null,
          calledThisYear: counters?.calledThisYear ?? 0,
          visitsThisYear: counters?.visitsThisYear ?? 0,
          year: period.year,
          month: period.month,
          thisPeriod,
          lastYear,
          lastMonth,
          // `0` on every reference row, where last year is empty. Reasoned:
          // the change against the same month a year earlier.
          trend:
            lastYear.revenue === 0
              ? null
              : ((thisPeriod.revenue - lastYear.revenue) /
                  Math.abs(lastYear.revenue)) *
                100,
        };
      })
      .sort((a, b) => a.customerName.localeCompare(b.customerName));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch customer revenue"));
  }
};

const filteredRows = async (
  query: TableQuery,
): Promise<CustomerRevenueRow[]> => {
  const all = await customerRevenueRows(query);

  const term = query.q?.toLowerCase() ?? null;
  const representatives = query.filters.representative ?? [];
  const active = query.filters.active ?? [];

  return all.filter((row) => {
    if (
      term &&
      !row.customerName.toLowerCase().includes(term) &&
      String(row.customerCode) !== term
    ) {
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
