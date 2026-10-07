"use server";

import { CUSTOMER_REVENUE_SPLIT_COLUMNS } from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/columns";
import { db } from "@/db";
import { SelectBranchSettings } from "@/db/schema/branch-settings";
import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectOrderItems } from "@/db/schema/order-items";
import { SelectOrders } from "@/db/schema/orders";
import { SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { describeError, profitMarginPercent } from "@/lib/helpers";
import { getBranchSettings } from "@/lib/server/branch-settings";
import {
  getCompetitorShares,
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

export type CustomerRevenueSplitRow = {
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
  orderType: NonNullable<SelectOrders["orderType"]>;
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
 * C10 with the order split out — and "order type" means two things on that
 * screen, so both are columns: the **order's** type (Normal / Call-off / Rush /
 * Ex works) and the **line's** source (Stk / CD).
 *
 * The reference's C11 sums to C10 cell for cell, with call-off and rush exact
 * against the orders they came from. A charge always counts as `Normal` and has
 * no source — 253 of its 253 charge rows.
 *
 * Both halves inherit C10's split: material revenue under the product's revenue
 * group, option revenue under the option's, charges as rows of their own.
 */
const splitRows = async (
  query: TableQuery,
): Promise<CustomerRevenueSplitRow[]> => {
  const facts = await getRevenueFacts();
  const companies = await getRevenueCompanies();
  const competitors = await getCompetitorShares();
  const { affiliateName } = await getBranchSettings(db);

  const rows = new Map<string, CustomerRevenueSplitRow>();
  for (const fact of facts) {
    // A charge belongs to the invoice rather than to a sold line, so it has no
    // supply route and the reference counts it as an ordinary order.
    const orderType = fact.orderType ?? "normal";
    const key = [
      fact.companyUuid,
      fact.revenueGroupNumber,
      orderType,
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
      orderType,
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

  const all = [...rows.values()]
    .map((row) => ({
      ...row,
      profitMargin: profitMarginPercent(row.revenue, row.profit),
      replacementMargin: profitMarginPercent(
        row.revenue,
        row.replacementProfit,
      ),
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
        (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0) ||
        a.orderType.localeCompare(b.orderType),
    );

  const term = query.q?.toLowerCase() ?? null;
  const groups = query.filters.revenueGroup ?? [];
  const orderTypes = query.filters.orderType ?? [];
  const sourceTypes = query.filters.sourceType ?? [];

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
    if (orderTypes.length > 0 && !orderTypes.includes(row.orderType)) {
      return false;
    }
    if (sourceTypes.length > 0 && !sourceTypes.includes(row.sourceType ?? "")) {
      return false;
    }
    return true;
  });
};

export const getCustomerRevenueSplit = async (
  query: TableQuery,
): Promise<Paged<CustomerRevenueSplitRow>> => {
  try {
    const rows = await splitRows(query);
    const start = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch customer revenue split"),
    );
  }
};

export const exportCustomerRevenueSplit = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await splitRows(parseTableQuery(params));

  return exportRows({
    name: "Customer revenue per revenue group split",
    columns: CUSTOMER_REVENUE_SPLIT_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};
