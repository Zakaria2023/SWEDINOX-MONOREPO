"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { asc, eq, getTableColumns } from "drizzle-orm";

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "firstName" | "lastName"
>;

export type ContactDetail = SelectContacts & {
  companyName: SelectCompanies["companyName"] | null;
  companyId: SelectCompanies["id"] | null;
  companyRoles: SelectCompanies["roles"] | null;
};

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
 * One contact person with everything recorded on them and the company they
 * belong to.
 *
 * This is the canonical contact screen: the contact-persons-customers-and-
 * prospects and contact-persons-suppliers overviews both list `Contacts` rows,
 * so they link here rather than each carrying their own screen.
 */
export const getContactDetail = async (
  uuid: string,
): Promise<ContactDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(Contacts),
      companyName: Companies.companyName,
      companyId: Companies.id,
      companyRoles: Companies.roles,
    })
    .from(Contacts)
    .leftJoin(Companies, eq(Companies.uuid, Contacts.companyUuid))
    .where(eq(Contacts.uuid, uuid))
    .limit(1);

  return row ?? null;
};
