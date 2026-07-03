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
  "initials" | "email" | "customerRegionCode"
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
      initials: Contacts.initials,
      email: Contacts.email,
      customerRegionCode: Contacts.customerRegionCode,
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
