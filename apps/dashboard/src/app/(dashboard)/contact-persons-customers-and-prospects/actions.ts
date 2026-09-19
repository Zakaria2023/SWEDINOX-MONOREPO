"use server";

import { CONTACT_PERSON_COLUMNS } from "@/app/(dashboard)/contact-persons-customers-and-prospects/columns";
import { Companies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import {
  contactPersonRows,
  ContactPersonRow,
  countContactPersons,
  getContactPersonRegions,
} from "@/lib/server/contact-persons";
import { exportRows } from "@/lib/server/excel";
import { runPaged } from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { or, sql } from "drizzle-orm";

// Customer **xor** prospect, proved on all 2 188 of the reference's rows — a
// company is one or the other, never both, so this list is every contact of
// either.
const CUSTOMER_OR_PROSPECT = or(
  sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
  sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
);

export type ContactPersonCustomerProspectRow = ContactPersonRow;

/**
 * Every contact of a customer or prospect, with its company's columns read from
 * the company.
 *
 * Paged. The reference's list is 6 796 contacts and this screen used to fetch
 * all of them, each carrying the company's visiting address and both revenue
 * figures, before handing the array to the browser. The question a list this
 * size answers is "where is this one person", so it is searched and filtered on
 * the server.
 */
export const getContactPersonsCustomersAndProspects = async (
  query: TableQuery,
): Promise<Paged<ContactPersonCustomerProspectRow>> => {
  try {
    return await runPaged(query, {
      rows: contactPersonRows(CUSTOMER_OR_PROSPECT, query),
      count: () => countContactPersons(CUSTOMER_OR_PROSPECT, query),
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch contact persons"));
  }
};

export const exportContactPersonsCustomersAndProspects = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Contact persons",
    columns: CONTACT_PERSON_COLUMNS,
    columnKeys,
    rows: contactPersonRows(CUSTOMER_OR_PROSPECT, parseTableQuery(params)),
  });

/** The regions these contacts' companies carry, for the overview's filter. */
export const getContactPersonCustomerRegions = async (): Promise<string[]> =>
  getContactPersonRegions(CUSTOMER_OR_PROSPECT);
