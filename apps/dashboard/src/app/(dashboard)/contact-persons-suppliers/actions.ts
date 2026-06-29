"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { eq, getTableColumns, sql } from "drizzle-orm";

export type ContactPersonSupplierRow = SelectContacts &
  Pick<SelectCompanies, "companyName"> & {
    companyId: SelectCompanies["id"];
  };

export const getContactPersonsSuppliers = async (): Promise<ContactPersonSupplierRow[]> =>
  db
    .select({
      ...getTableColumns(Contacts),
      companyName: Companies.companyName,
      companyId: Companies.id,
    })
    .from(Contacts)
    .innerJoin(Companies, eq(Companies.uuid, Contacts.companyUuid))
    .where(sql`JSON_CONTAINS(${Companies.roles}, '"supplier"')`);
