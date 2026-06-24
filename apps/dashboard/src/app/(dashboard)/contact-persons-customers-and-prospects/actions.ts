"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { eq, getTableColumns, or, sql } from "drizzle-orm";

export type ContactPersonCustomerProspectRow = SelectContacts &
  Pick<SelectCompanies, "companyName"> & {
    companyId: SelectCompanies["id"];
  };

export const getContactPersonsCustomersAndProspects = async (): Promise<
  ContactPersonCustomerProspectRow[]
> => {
  const rows = await db
    .select({
      ...getTableColumns(Contacts),
      companyName: Companies.companyName,
      companyId: Companies.id,
    })
    .from(Contacts)
    .innerJoin(Companies, eq(Companies.uuid, Contacts.companyUuid))
    .where(
      or(
        sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
        sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
      ),
    );

  return rows.map((r) => ({
    ...r,
    companyName: r.companyName,
    companyId: r.companyId,
  }));
};
