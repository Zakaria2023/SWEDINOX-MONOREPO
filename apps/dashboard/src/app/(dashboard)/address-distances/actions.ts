"use server";

import { ADDRESS_DISTANCE_COLUMNS } from "@/app/(dashboard)/address-distances/columns";
import { addressDistanceSchema } from "@/app/(dashboard)/address-distances/validation";
import {
  AddressDistances,
  Companies,
  CompanyAddresses,
  db,
  SelectAddressDistances,
  SelectCompanies,
  SelectCompanyAddresses,
} from "@/db";
import { requireAuth } from "@/lib/auth";
import { describeError } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  FilterBindings,
  numberRangeFilter,
  relationFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, asc, count, eq, getTableColumns, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// One address and how far it is from us. Not a distance between two addresses:
// the reference's thirteen `0` rows are all our own depot, in thirteen
// spellings, which is what fixes the origin.
//
// It is also what prices a delivery — `TransporterCosts` bands a transporter's
// tariff by `fromKm`/`untilKm` — so the number matters beyond this screen.
const ADDRESS_DISTANCE_SEARCH = [
  AddressDistances.city,
  AddressDistances.street,
  AddressDistances.postalCode,
] as const;

const ADDRESS_DISTANCE_FILTERS: FilterBindings = {
  country: valueFilter(AddressDistances.country),
  company: relationFilter(AddressDistances.companyUuid),
  km: numberRangeFilter(AddressDistances.km),
};

const ADDRESS_DISTANCE_SORTABLE: SortableColumns = {
  country: AddressDistances.country,
  city: AddressDistances.city,
  km: AddressDistances.km,
};

export type AddressDistanceListItem = SelectAddressDistances & {
  companyName: SelectCompanies["companyName"] | null;
};

export type AddressDistanceDetail = AddressDistanceListItem & {
  companyId: SelectCompanies["id"] | null;
  matchingAddresses: AddressDistanceAddressRow[];
};

export type AddressDistanceAddressRow = Pick<
  SelectCompanyAddresses,
  "uuid" | "altName" | "streetAndNo" | "postalCode" | "city" | "country"
>;

export type AddressDistanceActionResult = {
  error?: string;
  success?: boolean;
};

export type AddressDistanceEditInput = {
  uuid: string;
  country: string;
  city: string;
  street: string;
  postalCode: string;
  km: string;
};

const addressDistanceRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<AddressDistanceListItem[]> =>
    db
      .select({
        ...getTableColumns(AddressDistances),
        companyName: Companies.companyName,
      })
      .from(AddressDistances)
      .leftJoin(Companies, eq(Companies.uuid, AddressDistances.companyUuid))
      .where(
        tableWhere({
          query,
          search: ADDRESS_DISTANCE_SEARCH,
          filters: ADDRESS_DISTANCE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          ADDRESS_DISTANCE_SORTABLE,
          query,
          [asc(AddressDistances.country), asc(AddressDistances.city)],
          AddressDistances.id,
        ),
      )
      .limit(limit)
      .offset(offset);

export const getAddressDistances = async (
  query: TableQuery,
): Promise<Paged<AddressDistanceListItem>> => {
  try {
    return await runPaged(query, {
      rows: addressDistanceRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(AddressDistances)
          .leftJoin(Companies, eq(Companies.uuid, AddressDistances.companyUuid))
          .where(
            tableWhere({
              query,
              search: ADDRESS_DISTANCE_SEARCH,
              filters: ADDRESS_DISTANCE_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch address distances"));
  }
};

export const exportAddressDistances = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Address distances",
    columns: ADDRESS_DISTANCE_COLUMNS,
    columnKeys,
    rows: addressDistanceRows(parseTableQuery(params)),
  });

/** The countries the recorded distances actually carry, for the filter. */
export const getAddressDistanceCountries = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ country: AddressDistances.country })
    .from(AddressDistances)
    .where(isNotNull(AddressDistances.country))
    .orderBy(asc(AddressDistances.country));

  return rows
    .map((row) => row.country)
    .filter((country): country is string => country !== null && country !== "");
};

/**
 * `Edit selected line` — the reference's only row action on this screen, which
 * opens the address and its kilometres for correction.
 *
 * The reference fills the kilometres from Google on request; we have no such
 * lookup, so the number is typed.
 */
export const updateAddressDistance = async (
  _prevState: AddressDistanceActionResult,
  input: AddressDistanceEditInput,
): Promise<AddressDistanceActionResult> => {
  await requireAuth();

  const parsed = addressDistanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid distance" };
  }

  try {
    await db
      .update(AddressDistances)
      .set({
        country: parsed.data.country || null,
        city: parsed.data.city || null,
        street: parsed.data.street || null,
        postalCode: parsed.data.postalCode || null,
        km: parsed.data.km,
      })
      .where(eq(AddressDistances.uuid, input.uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to save the distance") };
  }

  revalidatePath("/address-distances");
  revalidatePath(`/address-distances/${input.uuid}`);
  return { success: true };
};

/**
 * One recorded haulage distance, with the company it was recorded for and the
 * addresses on that company it applies to.
 *
 * The addresses are matched on city and postal code, which is the only link
 * between the two tables — a distance is recorded against a place, not against
 * one specific address row.
 */
export const getAddressDistanceDetail = async (
  uuid: string,
): Promise<AddressDistanceDetail | null> => {
  const [row] = await db
    .select({
      addressDistance: AddressDistances,
      companyName: Companies.companyName,
      companyId: Companies.id,
    })
    .from(AddressDistances)
    .leftJoin(Companies, eq(Companies.uuid, AddressDistances.companyUuid))
    .where(eq(AddressDistances.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const { companyUuid, city, postalCode } = row.addressDistance;

  // With no company or no place to match on there is nothing to look up; an
  // unfiltered query here would return every address in the system.
  const matchingAddresses =
    companyUuid && (city || postalCode)
      ? await db
          .select({
            uuid: CompanyAddresses.uuid,
            altName: CompanyAddresses.altName,
            streetAndNo: CompanyAddresses.streetAndNo,
            postalCode: CompanyAddresses.postalCode,
            city: CompanyAddresses.city,
            country: CompanyAddresses.country,
          })
          .from(CompanyAddresses)
          .where(
            and(
              eq(CompanyAddresses.companyUuid, companyUuid),
              city ? eq(CompanyAddresses.city, city) : undefined,
              postalCode
                ? eq(CompanyAddresses.postalCode, postalCode)
                : undefined,
            ),
          )
          .orderBy(asc(CompanyAddresses.sequenceNumber))
      : [];

  return {
    ...row.addressDistance,
    companyName: row.companyName,
    companyId: row.companyId,
    matchingAddresses,
  };
};
