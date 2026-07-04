"use server";

import { db } from "@/db";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { toMapByCompanyUuid } from "@/lib/helpers";
import { and, asc, eq, min } from "drizzle-orm";

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "firstName" | "lastName"
>;

export type PrimaryContact = Pick<
  SelectContacts,
  | "firstName"
  | "lastName"
  | "email"
  | "mobile"
  | "createdAt"
  | "revenueLastYear"
  | "revenueThisYear"
  | "competitors"
  | "customerRegionCode"
  | "visitStreetAndNo"
  | "visitPostalCode"
  | "visitCity"
  | "visitCountry"
  | "visitTelephone"
  | "visitFax"
  | "streetAndNo"
  | "postalCode"
  | "city"
  | "addressCountry"
  | "addressTelephone"
  | "addressFax"
>;

export const getContactsForCompany = async (
  companyUuid: string,
): Promise<ContactOption[]> =>
  db
    .select({
      uuid: Contacts.uuid,
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
    })
    .from(Contacts)
    .where(eq(Contacts.companyUuid, companyUuid))
    .orderBy(asc(Contacts.firstName));

export const getPrimaryContactsByCompany = async (): Promise<
  Map<string, PrimaryContact>
> => {
  const primaryContactSeq = db
    .select({
      companyUuid: Contacts.companyUuid,
      minSequenceNumber: min(Contacts.sequenceNumber).as("min_sequence_number"),
    })
    .from(Contacts)
    .groupBy(Contacts.companyUuid)
    .as("primary_contact_seq");

  const rows = await db
    .select({
      companyUuid: Contacts.companyUuid,
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
      email: Contacts.email,
      mobile: Contacts.mobile,
      createdAt: Contacts.createdAt,
      revenueLastYear: Contacts.revenueLastYear,
      revenueThisYear: Contacts.revenueThisYear,
      competitors: Contacts.competitors,
      customerRegionCode: Contacts.customerRegionCode,
      visitStreetAndNo: Contacts.visitStreetAndNo,
      visitPostalCode: Contacts.visitPostalCode,
      visitCity: Contacts.visitCity,
      visitCountry: Contacts.visitCountry,
      visitTelephone: Contacts.visitTelephone,
      visitFax: Contacts.visitFax,
      streetAndNo: Contacts.streetAndNo,
      postalCode: Contacts.postalCode,
      city: Contacts.city,
      addressCountry: Contacts.addressCountry,
      addressTelephone: Contacts.addressTelephone,
      addressFax: Contacts.addressFax,
    })
    .from(Contacts)
    .innerJoin(
      primaryContactSeq,
      and(
        eq(Contacts.companyUuid, primaryContactSeq.companyUuid),
        eq(Contacts.sequenceNumber, primaryContactSeq.minSequenceNumber),
      ),
    );

  return toMapByCompanyUuid(rows);
};
