"use server";

import { db, SelectCompanyAddresses } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { toMapByCompanyUuid } from "@/lib/helpers";
import { and, desc, eq, min, sql } from "drizzle-orm";

export type AddressListItem = {
  CompanyAddresses: SelectCompanyAddresses;
  Companies: SelectCompanies | null;
};

export type AddressSelectOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "city"
>;

export type DeliveryAddress = Pick<
  SelectCompanyAddresses,
  "streetAndNo" | "postalCode" | "city" | "country"
>;

export const getAddresses = async (): Promise<AddressListItem[]> =>
  db
    .select()
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
    .orderBy(desc(CompanyAddresses.createdAt));

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

export const getDeliveryAddressesByCompany = async (): Promise<
  Map<string, DeliveryAddress>
> => {
  const deliveryAddressSeq = db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      minSequenceNumber: min(CompanyAddresses.sequenceNumber).as(
        "min_sequence_number",
      ),
    })
    .from(CompanyAddresses)
    .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"delivery"')`)
    .groupBy(CompanyAddresses.companyUuid)
    .as("delivery_address_seq");

  const rows = await db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      postalCode: CompanyAddresses.postalCode,
      city: CompanyAddresses.city,
      country: CompanyAddresses.country,
    })
    .from(CompanyAddresses)
    .innerJoin(
      deliveryAddressSeq,
      and(
        eq(CompanyAddresses.companyUuid, deliveryAddressSeq.companyUuid),
        eq(
          CompanyAddresses.sequenceNumber,
          deliveryAddressSeq.minSequenceNumber,
        ),
      ),
    );

  return toMapByCompanyUuid(rows);
};
