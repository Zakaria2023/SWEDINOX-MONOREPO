"use server";

import { SUPPLIER_REVENUE_PER_GROUP_COLUMNS } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/columns";
import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { SelectPurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { describeError } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  getSupplierRevenueCompanies,
  getSupplierRevenueFacts,
} from "@/lib/server/supplier-revenue";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";

export type SupplierRevenuePerGroupRow = {
  key: string;
  supplierName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  creditorNumber: SelectCompanies["creditorNumber"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  sourceType: SelectPurchaseOrderItems["sourceType"] | null;
  year: number;
  month: number;
  /**
   * The quantity in the price unit — kilos for `TN` and `KG`, which is what
   * the reference prints (248 of 249 `TN` rows equal their weight), the
   * invoiced quantity otherwise.
   */
  demand: number;
  priceUnit: string | null;
  revenue: number;
  weightKg: number;
  avgPricePerKg: number | null;
};

/**
 * Purchase turnover per supplier × revenue group × order type × invoice
 * month × price unit — the reference's own grain, unique on its 361 rows.
 */
const supplierRevenueRows = async (
  query: TableQuery,
): Promise<SupplierRevenuePerGroupRow[]> => {
  const facts = await getSupplierRevenueFacts();
  const companies = await getSupplierRevenueCompanies([
    ...new Set(facts.map((fact) => fact.supplierUuid)),
  ]);

  const rows = new Map<string, SupplierRevenuePerGroupRow>();
  for (const fact of facts) {
    const key = [
      fact.supplierUuid,
      fact.revenueGroupNumber ?? "",
      fact.sourceType ?? "",
      fact.year,
      fact.month,
      fact.priceUnit ?? "",
    ].join("|");
    const company = companies.get(fact.supplierUuid);
    const row = rows.get(key) ?? {
      key,
      supplierName: company?.companyName ?? null,
      city: company?.city ?? null,
      creditorNumber: company?.creditorNumber ?? null,
      revenueGroupNumber: fact.revenueGroupNumber,
      revenueGroupName: fact.revenueGroupName,
      sourceType: fact.sourceType,
      year: fact.year,
      month: fact.month,
      demand: 0,
      priceUnit: fact.priceUnit,
      revenue: 0,
      weightKg: 0,
      avgPricePerKg: null,
    };
    row.demand +=
      fact.priceUnit === "TN" || fact.priceUnit === "KG"
        ? fact.weightKg
        : fact.quantity;
    row.revenue += fact.revenue;
    row.weightKg += fact.weightKg;
    rows.set(key, row);
  }

  const all = [...rows.values()]
    .map((row) => ({
      ...row,
      avgPricePerKg: row.weightKg === 0 ? null : row.revenue / row.weightKg,
    }))
    .sort(
      (a, b) =>
        (a.supplierName ?? "").localeCompare(b.supplierName ?? "") ||
        a.year - b.year ||
        a.month - b.month ||
        (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0),
    );

  const term = query.q?.toLowerCase() ?? null;
  const years = query.filters.year ?? [];
  const months = query.filters.month ?? [];
  const sourceTypes = query.filters.sourceType ?? [];

  return all.filter((row) => {
    if (
      term &&
      !`${row.supplierName ?? ""} ${row.revenueGroupName ?? ""}`
        .toLowerCase()
        .includes(term)
    ) {
      return false;
    }
    if (years.length > 0 && !years.includes(String(row.year))) {
      return false;
    }
    if (months.length > 0 && !months.includes(String(row.month))) {
      return false;
    }
    if (
      sourceTypes.length > 0 &&
      !sourceTypes.includes(row.sourceType ?? "")
    ) {
      return false;
    }
    return true;
  });
};

export const getSupplierRevenuePerRevenueGroup = async (
  query: TableQuery,
): Promise<Paged<SupplierRevenuePerGroupRow>> => {
  try {
    const rows = await supplierRevenueRows(query);
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
        "Failed to fetch supplier revenue per revenue group",
      ),
    );
  }
};

export const exportSupplierRevenuePerRevenueGroup = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await supplierRevenueRows(parseTableQuery(params));

  return exportRows({
    name: "Supplier revenue per revenue group",
    columns: SUPPLIER_REVENUE_PER_GROUP_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};
