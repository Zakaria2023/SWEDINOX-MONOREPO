"use server";

import { db, SelectCompanyAddresses } from "@/db";
import {
  AddressDistances,
  SelectAddressDistances,
} from "@/db/schema/address-distances";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { and, asc, desc, eq, getTableColumns } from "drizzle-orm";

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

export const getAddresses = async (): Promise<AddressListItem[]> =>
  db
    .select()
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
    .orderBy(desc(CompanyAddresses.createdAt));

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
