"use server";

import {
  AddressDistances,
  Companies,
  CompanyAddresses,
  db,
  SelectAddressDistances,
  SelectCompanies,
  SelectCompanyAddresses,
} from "@/db";
import { and, asc, desc, eq } from "drizzle-orm";

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

export const getAddressDistances = async (): Promise<
  AddressDistanceListItem[]
> => {
  const rows = await db
    .select({
      addressDistance: AddressDistances,
      companyName: Companies.companyName,
    })
    .from(AddressDistances)
    .leftJoin(Companies, eq(Companies.uuid, AddressDistances.companyUuid))
    .orderBy(desc(AddressDistances.createdAt));

  return rows.map((r) => ({
    ...r.addressDistance,
    companyName: r.companyName,
  }));
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
