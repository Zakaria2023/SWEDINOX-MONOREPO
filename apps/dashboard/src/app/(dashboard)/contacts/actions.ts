"use server";

import { db } from "@/db";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  ContactPersonRow,
  getContactPersonRows,
} from "@/lib/server/contact-persons";
import { asc, eq } from "drizzle-orm";

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "firstName" | "lastName"
>;

export type ContactDetail = ContactPersonRow;

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

/**
 * One contact person with everything recorded on them and their company's
 * columns beside them.
 *
 * This is the canonical contact screen: the contact-persons-customers-and-
 * prospects and contact-persons-suppliers overviews both list the same rows,
 * so they link here rather than each carrying their own screen.
 */
export const getContactDetail = async (
  uuid: string,
): Promise<ContactDetail | null> => {
  const [row] = await getContactPersonRows(eq(Contacts.uuid, uuid));
  return row ?? null;
};
