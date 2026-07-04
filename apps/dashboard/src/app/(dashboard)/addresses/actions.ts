"use server";

import { db, SelectCompanyAddresses } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { asc, desc, eq } from "drizzle-orm";

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
