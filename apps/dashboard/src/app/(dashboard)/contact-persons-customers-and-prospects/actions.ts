"use server";

import { Companies } from "@/db/schema/companies";
import {
  ContactPersonRow,
  getContactPersonRows,
} from "@/lib/server/contact-persons";
import { or, sql } from "drizzle-orm";

export type ContactPersonCustomerProspectRow = ContactPersonRow;

// Every contact of a customer or prospect, with its company's columns read
// from the company.
export const getContactPersonsCustomersAndProspects = async (): Promise<
  ContactPersonCustomerProspectRow[]
> =>
  getContactPersonRows(
    or(
      sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
      sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
    ),
  );
