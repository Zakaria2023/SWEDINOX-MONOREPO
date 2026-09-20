"use server";

import { CUSTOMER_REVENUE_SALES_VISITS_COLUMNS } from "@/app/(dashboard)/customer-revenue-sales-and-visits/columns";
import { db } from "@/db";
import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { VisitReports } from "@/db/schema/visit-reports";
import { describeError } from "@/lib/helpers";
import {
  getRevenueCompanies,
  getRevenueFacts,
} from "@/lib/server/customer-revenue";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { gte, sql } from "drizzle-orm";

export type CustomerRevenueSalesVisitsRow = {
  representative: SelectCompanies["representative"] | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  visitPostalCode: SelectCompanyAddresses["postalCode"] | null;
  visitCity: SelectCompanyAddresses["city"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  currentYear: number;
  revenueCurrentYear: number;
  revenueLastYear: number;
  revenueTwoYearsAgo: number;
  kgCurrentYear: number;
  kgLastYear: number;
  kgTwoYearsAgo: number;
  targetVisitsPerYear: SelectCompanies["visitFrequency"];
  visitsCurrentYear: number;
  visitsLastYear: number;
  visitsTwoYearsAgo: number;
  region: SelectCompanies["region"] | null;
};

/** Visits recorded per company for the three years the screen reports. */
const visitsByCompanyYear = async (
  currentYear: number,
): Promise<Map<string, number>> => {
  const rows = await db
    .select({
      companyUuid: VisitReports.companyUuid,
      year: sql<number>`YEAR(${VisitReports.visitDate})`,
      total: sql<number>`COUNT(*)`,
    })
    .from(VisitReports)
    .where(gte(sql`YEAR(${VisitReports.visitDate})`, currentYear - 2))
    .groupBy(VisitReports.companyUuid, sql`YEAR(${VisitReports.visitDate})`);

  return new Map(
    rows.map((row) => [`${row.companyUuid}|${row.year}`, Number(row.total)]),
  );
};

/**
 * Three whole years per customer × revenue group, keyed by **company code**.
 *
 * The reference's C12 has no month — `Current year` 2025 means all of 2025 —
 * and its 809 cells equal C10 summed over the year, so it reads the same
 * product, option and charge revenue C10 does.
 *
 * ⚠️ It keys the customer by `Company code` while C9, C10 and C11 key it by
 * `Debtor number`. A company has a relationship code and a separate ledger
 * account number, and joining the two families on the visible number matches
 * only 672 of 1 720 rows, by accident. Both are carried on the company here.
 *
 * Only customers with revenue in the window appear, which is what the
 * reference does — 290 of its 1 724.
 */
const salesAndVisitsRows = async (
  query: TableQuery,
  currentYear: number,
): Promise<CustomerRevenueSalesVisitsRow[]> => {
  const facts = await getRevenueFacts();
  const companies = await getRevenueCompanies();
  const visits = await visitsByCompanyYear(currentYear);

  const rows = new Map<string, CustomerRevenueSalesVisitsRow>();
  for (const fact of facts) {
    const offset = currentYear - fact.year;
    if (offset < 0 || offset > 2) {
      continue;
    }
    const key = `${fact.companyUuid}|${fact.revenueGroupNumber}`;
    const company = companies.get(fact.companyUuid);
    const row = rows.get(key) ?? {
      representative: company?.representative ?? null,
      companyCode: company?.id ?? null,
      companyName: company?.companyName ?? null,
      visitPostalCode: company?.postalCode ?? null,
      visitCity: company?.city ?? null,
      revenueGroupNumber: fact.revenueGroupNumber,
      revenueGroupName: fact.revenueGroupName,
      currentYear,
      revenueCurrentYear: 0,
      revenueLastYear: 0,
      revenueTwoYearsAgo: 0,
      kgCurrentYear: 0,
      kgLastYear: 0,
      kgTwoYearsAgo: 0,
      // The reference prints its target and all three visit counts as 0 on
      // every one of its 809 rows: the screen is named for visits and its
      // counters are batch statistics that stopped running. Ours counts the
      // reports themselves, and reads the target off the company.
      targetVisitsPerYear: company?.visitFrequency ?? 0,
      visitsCurrentYear: visits.get(`${fact.companyUuid}|${currentYear}`) ?? 0,
      visitsLastYear: visits.get(`${fact.companyUuid}|${currentYear - 1}`) ?? 0,
      visitsTwoYearsAgo:
        visits.get(`${fact.companyUuid}|${currentYear - 2}`) ?? 0,
      region: company?.region ?? null,
    };
    if (offset === 0) {
      row.revenueCurrentYear += fact.revenue;
      row.kgCurrentYear += fact.weightKg;
    } else if (offset === 1) {
      row.revenueLastYear += fact.revenue;
      row.kgLastYear += fact.weightKg;
    } else {
      row.revenueTwoYearsAgo += fact.revenue;
      row.kgTwoYearsAgo += fact.weightKg;
    }
    rows.set(key, row);
  }

  const all = [...rows.values()].sort(
    (a, b) =>
      (a.companyName ?? "").localeCompare(b.companyName ?? "") ||
      (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0),
  );

  const term = query.q?.toLowerCase() ?? null;
  const groups = query.filters.revenueGroup ?? [];
  const representatives = query.filters.representative ?? [];

  return all.filter((row) => {
    if (
      term &&
      !`${row.companyName ?? ""} ${row.revenueGroupName ?? ""}`
        .toLowerCase()
        .includes(term)
    ) {
      return false;
    }
    if (
      groups.length > 0 &&
      !groups.includes(String(row.revenueGroupNumber ?? ""))
    ) {
      return false;
    }
    if (
      representatives.length > 0 &&
      !representatives.includes(row.representative ?? "")
    ) {
      return false;
    }
    return true;
  });
};

export const getCustomerRevenueSalesVisits = async (
  query: TableQuery,
  currentYear: number = new Date().getFullYear(),
): Promise<Paged<CustomerRevenueSalesVisitsRow>> => {
  try {
    const rows = await salesAndVisitsRows(query, currentYear);
    const start = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch customer revenue, sales and visits",
      ),
    );
  }
};

export const exportCustomerRevenueSalesVisits = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await salesAndVisitsRows(
    parseTableQuery(params),
    new Date().getFullYear(),
  );

  return exportRows({
    name: "Customer revenue, sales and visits",
    columns: CUSTOMER_REVENUE_SALES_VISITS_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};
