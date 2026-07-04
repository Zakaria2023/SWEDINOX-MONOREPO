"use server";

import { db, SelectCompanyAddresses } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { toMapByCompanyUuid } from "@/lib/helpers";
import { and, asc, desc, eq, min } from "drizzle-orm";

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

export type PrimaryAddress = Pick<
  SelectCompanyAddresses,
  "streetAndNo" | "city" | "postalCode" | "email"
>;

export const getPrimaryAddressesByCompany = async (): Promise<
  Map<string, PrimaryAddress>
> => {
  const primaryAddressSeq = db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      minSequenceNumber: min(CompanyAddresses.sequenceNumber).as(
        "min_sequence_number",
      ),
    })
    .from(CompanyAddresses)
    .groupBy(CompanyAddresses.companyUuid)
    .as("primary_address_seq");

  const rows = await db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
      postalCode: CompanyAddresses.postalCode,
      email: CompanyAddresses.email,
    })
    .from(CompanyAddresses)
    .innerJoin(
      primaryAddressSeq,
      and(
        eq(CompanyAddresses.companyUuid, primaryAddressSeq.companyUuid),
        eq(
          CompanyAddresses.sequenceNumber,
          primaryAddressSeq.minSequenceNumber,
        ),
      ),
    );

  return toMapByCompanyUuid(rows);
};
