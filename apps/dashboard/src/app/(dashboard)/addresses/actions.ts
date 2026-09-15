"use server";

import { db, SelectCompanyAddresses } from "@/db";
import {
  AddressDistances,
  SelectAddressDistances,
} from "@/db/schema/address-distances";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { ADDRESS_COLUMNS } from "@/app/(dashboard)/addresses/columns";
import { addressCategories } from "@/lib/enums";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import {
  jsonArrayFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  sql,
} from "drizzle-orm";

export type AddressListItem = {
  CompanyAddresses: SelectCompanyAddresses;
  Companies: SelectCompanies | null;
};

export type AddressSelectOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "city"
>;

export type AddressOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "city" | "postalCode" | "altName"
>;

export type AddressDetail = SelectCompanyAddresses & {
  companyId: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  distanceKm: SelectAddressDistances["km"] | null;
};

// What the free-text box searches. Kept to the few columns somebody actually
// types into it — a search that spans every column on the table is slower and
// harder to predict, since a term matching a hidden column looks like a bug.
const ADDRESS_SEARCH = [
  CompanyAddresses.streetAndNo,
  CompanyAddresses.city,
  CompanyAddresses.postalCode,
  CompanyAddresses.altName,
  Companies.companyName,
] as const;

// The columns a header may sort on. Anything not named here cannot be sorted
// by, whatever the URL says.
const ADDRESS_SORTABLE = {
  company: Companies.companyName,
  streetAndNo: CompanyAddresses.streetAndNo,
  city: CompanyAddresses.city,
  postalCode: CompanyAddresses.postalCode,
  country: CompanyAddresses.country,
  category: CompanyAddresses.category,
  createdAt: CompanyAddresses.createdAt,
};

// Filtering by company narrows on company_uuid, which carries
// idx_company_addresses_company_uuid, so it is an index seek rather than a
// scan. Category is a JSON array and cannot be — see jsonArrayFilter — which is
// affordable here because this table holds one row per address.
const ADDRESS_FILTERS = {
  company: relationFilter(CompanyAddresses.companyUuid),
  category: jsonArrayFilter(CompanyAddresses.category, addressCategories),
};

/**
 * The rows one view of this overview selects, as a window onto them.
 *
 * Shared by the page and the export rather than written twice: the export is
 * the same query with the page window opened up, and the moment the two are
 * separate the file stops agreeing with the screen the first time a filter is
 * added to one of them.
 */
const addressRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<AddressListItem[]> =>
    db
      .select()
      .from(CompanyAddresses)
      .leftJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
      .where(
        tableWhere({
          query,
          search: ADDRESS_SEARCH,
          filters: ADDRESS_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          ADDRESS_SORTABLE,
          query,
          [desc(CompanyAddresses.createdAt)],
          CompanyAddresses.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/**
 * One page of addresses, narrowed by whatever the URL asked for.
 *
 * The join to Companies is an inner part of both the row query and the count,
 * because the search and the sort can both reach the company name — a count
 * that ignored the join would report more rows than the page can show.
 */
export const getAddresses = async (
  query: TableQuery,
): Promise<Paged<AddressListItem>> =>
  runPaged(query, {
    rows: addressRows(query),

    count: async () => {
      const [row] = await db
        .select({ value: count() })
        .from(CompanyAddresses)
        .leftJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
        .where(
          tableWhere({
            query,
            search: ADDRESS_SEARCH,
            filters: ADDRESS_FILTERS,
          }),
        );
      return Number(row?.value ?? 0);
    },
  });

/**
 * Every address the current view matches, as a workbook.
 *
 * The params are the ones in the reader's address bar, so the file is narrowed
 * and ordered exactly as the screen is — only without the page window, which is
 * the whole difference between an export and a screenshot.
 */
export const exportAddresses = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Addresses",
    columns: ADDRESS_COLUMNS,
    columnKeys,
    rows: addressRows(parseTableQuery(params)),
  });

export const getAddressesForCompany = async (
  companyUuid: string,
): Promise<AddressOption[]> =>
  db
    .select({
      uuid: CompanyAddresses.uuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
      postalCode: CompanyAddresses.postalCode,
      altName: CompanyAddresses.altName,
    })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(asc(CompanyAddresses.sequenceNumber));

/**
 * Our own addresses — every address of a company with the `internal` role.
 * A purchase is delivered to us, so this is what a delivery address picks from.
 */
export const getInternalAddressesForSelect = async (): Promise<
  AddressOption[]
> =>
  db
    .select({
      uuid: CompanyAddresses.uuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
      postalCode: CompanyAddresses.postalCode,
      altName: CompanyAddresses.altName,
    })
    .from(CompanyAddresses)
    .innerJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
    .where(sql`JSON_CONTAINS(${Companies.roles}, '"internal"')`)
    .orderBy(asc(Companies.companyName), asc(CompanyAddresses.sequenceNumber));

/**
 * One address with everything recorded on it and the company it belongs to.
 *
 * The haulage distance is joined on the address's own city and postal code
 * rather than by key: `AddressDistances` is a per-company distance table keyed by
 * place, not a child of `CompanyAddresses`, so matching on the place is the only
 * link between them. A missing row means no distance has been recorded.
 */
export const getAddressDetail = async (
  uuid: string,
): Promise<AddressDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(CompanyAddresses),
      companyId: Companies.id,
      companyName: Companies.companyName,
      distanceKm: AddressDistances.km,
    })
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
    .leftJoin(
      AddressDistances,
      and(
        eq(AddressDistances.companyUuid, CompanyAddresses.companyUuid),
        eq(AddressDistances.city, CompanyAddresses.city),
        eq(AddressDistances.postalCode, CompanyAddresses.postalCode),
      ),
    )
    .where(eq(CompanyAddresses.uuid, uuid))
    .limit(1);

  return row ?? null;
};

export const getAddressesForSelect = async (): Promise<
  AddressSelectOption[]
> => {
  const rows = await db
    .select({
      uuid: CompanyAddresses.uuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
    })
    .from(CompanyAddresses)
    .innerJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
    .orderBy(Companies.companyName);
  return rows;
};
