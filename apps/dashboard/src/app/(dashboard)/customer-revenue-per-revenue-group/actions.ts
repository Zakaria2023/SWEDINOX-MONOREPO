"use server";

import { CUSTOMER_REVENUE_PER_REVENUE_GROUP_COLUMNS } from "@/app/(dashboard)/customer-revenue-per-revenue-group/columns";
import { db } from "@/db";
import { SelectBranchSettings } from "@/db/schema/branch-settings";
import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectOrderItems } from "@/db/schema/order-items";
import { SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import { getBranchSettings } from "@/lib/server/branch-settings";
import {
  getCompetitorShares,
  getRevenueCompanies,
  getRevenueFacts,
  RevenueCompany,
  RevenueFact,
} from "@/lib/server/customer-revenue";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";

export type CustomerRevenuePerRevenueGroupRow = {
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  debtorNumber: SelectCompanies["debtorNumber"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  accountManager: SelectCompanies["accountManager"] | null;
  region: SelectCompanies["region"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  sourceType: SelectOrderItems["sourceType"] | null;
  year: number;
  month: number;
  salesPriceUnit: number;
  priceUnit: string | null;
  weightKg: number;
  quantity: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  invoiceLines: number;
  /** Revenue less the replacement cost; see `RevenueFact.replacementProfit`. */
  replacementProfit: number;
  replacementMargin: number;
  targetAnnualRevenue: SelectCompanies["targetAnnualRevenue"] | null;
  competitors: string | null;
  /** The branch's own legal name, from the settings. */
  affiliateName: SelectBranchSettings["affiliateName"];
};

/**
 * One row per customer x revenue group x order type x year x month x price
 * unit -- the reference's own grain, unique on all 1 720 of its rows.
 *
 * Every invoiced line is split in two: the material revenue lands under the
 * **product's** revenue group and the option revenue under the **option's** --
 * grinding to 3010, cutting to 3020, lasering to 3030 -- and every charge gets
 * a row of its own with no order type. That split is what makes this screen
 * reconcile to the invoice lines on all three halves.
 *
 * Unlike the reference, kilos and line counts here may be summed across
 * revenue groups: it repeats the parent line's weight and line count on every
 * option row, which is why its own totals come to 4 527 322 kg against a true
 * 3 373 330, and 8 691 lines against 5 650.
 */
const buildRows = (
  facts: RevenueFact[],
  companies: Map<string, RevenueCompany>,
  competitors: Map<string, string>,
  affiliateName: string | null,
): CustomerRevenuePerRevenueGroupRow[] => {
  const rows = new Map<string, CustomerRevenuePerRevenueGroupRow>();

  for (const fact of facts) {
    const key = [
      fact.companyUuid,
      fact.revenueGroupNumber,
      fact.sourceType ?? "",
      fact.year,
      fact.month,
      fact.priceUnit ?? "",
    ].join("|");
    const company = companies.get(fact.companyUuid);
    const row = rows.get(key) ?? {
      representative: company?.representative ?? null,
      customerGroup: company?.customerGroup ?? null,
      debtorNumber: company?.debtorNumber ?? null,
      customerName: company?.companyName ?? null,
      city: company?.city ?? null,
      country: company?.country ?? null,
      accountManager: company?.accountManager ?? null,
      region: company?.region ?? null,
      revenueGroupNumber: fact.revenueGroupNumber,
      revenueGroupName: fact.revenueGroupName,
      sourceType: fact.sourceType,
      year: fact.year,
      month: fact.month,
      salesPriceUnit: 0,
      priceUnit: fact.priceUnit,
      weightKg: 0,
      quantity: 0,
      revenue: 0,
      profit: 0,
      profitMargin: 0,
      invoiceLines: 0,
      replacementProfit: 0,
      replacementMargin: 0,
      targetAnnualRevenue: company?.targetAnnualRevenue ?? null,
      competitors: competitors.get(fact.companyUuid) ?? null,
      affiliateName,
    };
    row.revenue += fact.revenue;
    row.profit += fact.profit;
    row.replacementProfit += fact.replacementProfit;
    row.weightKg += fact.weightKg;
    row.quantity += fact.quantity;
    row.invoiceLines += fact.lines;
    rows.set(key, row);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      profitMargin: profitMarginPercent(row.revenue, row.profit),
      replacementMargin: profitMarginPercent(
        row.revenue,
        row.replacementProfit,
      ),
      // The sold quantity restated in the unit the line was priced in.
      salesPriceUnit:
        row.priceUnit === "TN"
          ? row.weightKg / 1000
          : row.priceUnit === "KG"
            ? row.weightKg
            : row.quantity,
    }))
    .sort(
      (a, b) =>
        (a.customerName ?? "").localeCompare(b.customerName ?? "") ||
        b.year - a.year ||
        b.month - a.month ||
        (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0),
    );
};

/**
 * The whole table, then the page.
 *
 * This one aggregates in memory rather than in SQL, because a row is built
 * from three different queries that cannot be unioned into one grain. The
 * inputs are already grouped by the database, so what is held here is
 * thousands of rows, not the invoice lines themselves.
 */
const revenueGroupRows = async (
  query: TableQuery,
): Promise<CustomerRevenuePerRevenueGroupRow[]> => {
  const facts = await getRevenueFacts();
  const companies = await getRevenueCompanies();
  const competitors = await getCompetitorShares();
  const { affiliateName } = await getBranchSettings(db);
  const all = buildRows(facts, companies, competitors, affiliateName);

  const term = query.q?.toLowerCase() ?? null;
  const groups = query.filters.revenueGroup ?? [];
  const representatives = query.filters.representative ?? [];
  const orderTypes = query.filters.orderType ?? [];

  return all.filter((row) => {
    if (
      term &&
      !`${row.customerName ?? ""} ${row.revenueGroupName ?? ""}`
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
    if (orderTypes.length > 0 && !orderTypes.includes(row.sourceType ?? "")) {
      return false;
    }
    return true;
  });
};

export const getCustomerRevenuePerRevenueGroup = async (
  query: TableQuery,
): Promise<Paged<CustomerRevenuePerRevenueGroupRow>> => {
  try {
    const rows = await revenueGroupRows(query);
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
        "Failed to fetch customer revenue per revenue group",
      ),
    );
  }
};

export const exportCustomerRevenuePerRevenueGroup = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const query = parseTableQuery(params);
  const rows = await revenueGroupRows(query);

  return exportRows({
    name: "Customer revenue per revenue group",
    columns: CUSTOMER_REVENUE_PER_REVENUE_GROUP_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};

/** The revenue groups that actually carry revenue, for the filter. */
export const getRevenueGroupOptions = async (): Promise<
  Array<{ value: string; label: string }>
> => {
  const facts = await getRevenueFacts();
  const seen = new Map<string, string>();

  for (const fact of facts) {
    if (fact.revenueGroupNumber !== null) {
      seen.set(
        String(fact.revenueGroupNumber),
        `${fact.revenueGroupNumber} ${fact.revenueGroupName ?? ""}`.trim(),
      );
    }
  }

  return [...seen.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([value, label]) => ({ value, label }));
};
