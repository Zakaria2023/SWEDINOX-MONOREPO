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
import { asc, count, eq, not, sql } from "drizzle-orm";

/**
 * Whether a company carries a remark.
 *
 * The reference prints every company, remark or not -- 2 531 lines of which
 * 1 546 are blank -- so this is a filter rather than the screen. Hiding the
 * blanks by default hid the fact that most accounts have never been written
 * up, which is itself worth seeing.
 */
// Parenthesised on purpose: negated for the "without one" filter, an unbraced
// NOT would bind to the first clause alone and quietly drop every null.
const HAS_A_REMARK = sql`(${Companies.remarks} IS NOT NULL AND ${Companies.remarks} <> '')`;

// The remark itself is searchable, which the reference's report has no way of
// doing — its Excel output is one column of 998 lines with no header.
const REMARK_SEARCH = [
  Companies.companyName,
  Companies.searchCode1,
  Companies.remarks,
] as const;

const REMARK_FILTERS: FilterBindings = {
  representative: enumFilter(Companies.representative, salesRepresentatives),
  hasRemark: (values) => {
    if (values.includes("yes")) {
      return HAS_A_REMARK;
    }
    if (values.includes("no")) {
      return not(HAS_A_REMARK);
    }
    return undefined;
  },
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
