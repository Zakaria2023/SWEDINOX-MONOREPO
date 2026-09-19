"use server";

import { REMARK_PER_COMPANY_COLUMNS } from "@/app/(dashboard)/remarks-per-company/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { salesRepresentatives } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { exportRows } from "@/lib/server/excel";
import {
  enumFilter,
  FilterBindings,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, asc, count, eq, isNotNull, ne, sql } from "drizzle-orm";

// Only companies that carry a remark (decided 14-9-2026; the reference prints
// all 2 531 companies and leaves 1 546 of the lines blank).
const HAS_A_REMARK = and(
  isNotNull(Companies.remarks),
  ne(Companies.remarks, sql`''`),
);

// The remark itself is searchable, which the reference's report has no way of
// doing — its Excel output is one column of 998 lines with no header.
const REMARK_SEARCH = [
  Companies.companyName,
  Companies.searchCode1,
  Companies.remarks,
] as const;

const REMARK_FILTERS: FilterBindings = {
  representative: enumFilter(Companies.representative, salesRepresentatives),
};

const REMARK_SORTABLE: SortableColumns = {
  customer: Companies.companyName,
  companyCode: Companies.id,
};

export type RemarkPerCompanyRow = {
  companyUuid: SelectCompanies["uuid"];
  companyCode: SelectCompanies["id"];
  customer: SelectCompanies["companyName"];
  representative: SelectCompanies["representative"];
  city: SelectCompanyAddresses["city"] | null;
  remarks: NonNullable<SelectCompanies["remarks"]>;
};

/**
 * Companies that carry a free-text remark, with their representative and city.
 *
 * Paged: 985 remarks against 2 531 companies in the reference, and the screen
 * used to fetch and render every one — each remark being a paragraph rather
 * than a cell, which is what makes this list heavy for its row count.
 */
const remarkRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<RemarkPerCompanyRow[]> => {
    // The city is the company's visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

    return db
      .select({
        companyUuid: Companies.uuid,
        companyCode: Companies.id,
        customer: Companies.companyName,
        representative: Companies.representative,
        city: visiting.city,
        remarks: Companies.remarks,
      })
      .from(Companies)
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(
        tableWhere({
          query,
          search: REMARK_SEARCH,
          filters: REMARK_FILTERS,
          scope: [HAS_A_REMARK],
        }),
      )
      .orderBy(
        ...tableOrderBy(
          REMARK_SORTABLE,
          query,
          [asc(Companies.companyName)],
          Companies.id,
        ),
      )
      .limit(limit)
      .offset(offset)
      .then((rows) =>
        rows.map((row) => ({
          companyUuid: row.companyUuid,
          companyCode: row.companyCode,
          customer: row.customer,
          representative: row.representative,
          city: row.city ?? null,
          remarks: row.remarks ?? "",
        })),
      );
  };

export const getRemarksPerCompany = async (
  query: TableQuery,
): Promise<Paged<RemarkPerCompanyRow>> => {
  try {
    return await runPaged(query, {
      rows: remarkRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Companies)
          .where(
            tableWhere({
              query,
              search: REMARK_SEARCH,
              filters: REMARK_FILTERS,
              scope: [HAS_A_REMARK],
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch remarks per company"),
    );
  }
};

export const exportRemarksPerCompany = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Remarks per company",
    columns: REMARK_PER_COMPANY_COLUMNS,
    columnKeys,
    rows: remarkRows(parseTableQuery(params)),
  });
