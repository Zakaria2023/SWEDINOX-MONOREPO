"use server";

import { SUPPLIER_REVENUE_COLUMNS } from "@/app/(dashboard)/supplier-revenue/columns";
import { db } from "@/db";
import { SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
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
import { isNotNull, sql } from "drizzle-orm";

export type SupplierRevenueRow = {
  key: string;
  supplierName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  year: number;
  month: number;
  revenue: number;
  weightKg: number;
};

/**
 * Purchase turnover per supplier and invoice month: what the supplier invoiced,
 * lines and surcharges, with the invoiced share of each line's weight. The same
 * facts as `Supplier revenue per revenue group`, summed per supplier.
 */
const supplierRevenueRows = async (
  query: TableQuery,
): Promise<SupplierRevenueRow[]> => {
  const facts = await getSupplierRevenueFacts();
  const companies = await getSupplierRevenueCompanies([
    ...new Set(facts.map((fact) => fact.supplierUuid)),
  ]);

  const rows = new Map<string, SupplierRevenueRow>();
  for (const fact of facts) {
    const key = `${fact.supplierUuid}|${fact.year}|${fact.month}`;
    const company = companies.get(fact.supplierUuid);
    const row = rows.get(key) ?? {
      key,
      supplierName: company?.companyName ?? null,
      supplierCode: company?.id ?? null,
      city: company?.city ?? null,
      country: company?.country ?? null,
      year: fact.year,
      month: fact.month,
      revenue: 0,
      weightKg: 0,
    };
    row.revenue += fact.revenue;
    row.weightKg += fact.weightKg;
    rows.set(key, row);
  }

  const all = [...rows.values()].sort(
    (a, b) =>
      (a.supplierName ?? "").localeCompare(b.supplierName ?? "") ||
      a.year - b.year ||
      a.month - b.month,
  );

  const term = query.q?.toLowerCase() ?? null;
  const years = query.filters.year ?? [];
  const months = query.filters.month ?? [];

  return all.filter((row) => {
    if (term && !(row.supplierName ?? "").toLowerCase().includes(term)) {
      return false;
    }
    if (years.length > 0 && !years.includes(String(row.year))) {
      return false;
    }
    if (months.length > 0 && !months.includes(String(row.month))) {
      return false;
    }
    return true;
  });
};

export const getSupplierRevenue = async (
  query: TableQuery,
): Promise<Paged<SupplierRevenueRow>> => {
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
    throw new Error(describeError(error, "Failed to fetch supplier revenue"));
  }
};

export const exportSupplierRevenue = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await supplierRevenueRows(parseTableQuery(params));

  return exportRows({
    name: "Supplier revenue",
    columns: SUPPLIER_REVENUE_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};

/** The years purchase invoices were dated in, for both screens' filter. */
export const getSupplierRevenueYears = async (): Promise<number[]> => {
  const rows = await db
    .selectDistinct({ year: sql<number>`YEAR(${PurchaseInvoices.invoiceDate})` })
    .from(PurchaseInvoices)
    .where(isNotNull(PurchaseInvoices.invoiceDate));

  return rows
    .map((row) => Number(row.year))
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => b - a);
};
