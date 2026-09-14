"use server";

import { Companies } from "@/db/schema/companies";
import {
  ContactPersonRow,
  getContactPersonRows,
} from "@/lib/server/contact-persons";
import { sql } from "drizzle-orm";

export type ContactPersonSupplierRow = ContactPersonRow;

// Every contact of a supplier, with its company's columns read from the
// company.
export const getContactPersonsSuppliers = async (): Promise<
  ContactPersonSupplierRow[]
> => getContactPersonRows(sql`JSON_CONTAINS(${Companies.roles}, '"supplier"')`);
