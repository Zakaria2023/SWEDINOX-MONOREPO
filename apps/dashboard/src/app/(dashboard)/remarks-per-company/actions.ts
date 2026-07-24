"use server";
import { describeError } from "@/lib/helpers";

import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { db } from "@/db";
import { and, asc, eq, isNotNull, min, ne, sql } from "drizzle-orm";

export type RemarkPerCompanyRow = {
  companyUuid: SelectCompanies["uuid"];
  companyCode: SelectCompanies["id"];
  customer: SelectCompanies["companyName"];
  representative: SelectCompanies["representative"];
  city: SelectContacts["city"] | null;
  remarks: NonNullable<SelectCompanies["remarks"]>;
};

// Companies that carry a free-text remark, with their representative and city —
// the "Customer remarks" report.
export const getRemarksPerCompany = async (): Promise<RemarkPerCompanyRow[]> => {
  try {
    const primaryContactId = db
      .select({
        companyUuid: Contacts.companyUuid,
        minId: min(Contacts.id).as("min_id"),
      })
      .from(Contacts)
      .groupBy(Contacts.companyUuid)
      .as("primary_contact_id");

    const primaryContact = db
      .select({
        companyUuid: Contacts.companyUuid,
        city: Contacts.city,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const rows = await db
      .select({
        companyUuid: Companies.uuid,
        companyCode: Companies.id,
        customer: Companies.companyName,
        representative: Companies.representative,
        city: primaryContact.city,
        remarks: Companies.remarks,
      })
      .from(Companies)
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .where(
        and(isNotNull(Companies.remarks), ne(Companies.remarks, sql`''`)),
      )
      .orderBy(asc(Companies.companyName));

    return rows.map((row) => ({
      companyUuid: row.companyUuid,
      companyCode: row.companyCode,
      customer: row.customer,
      representative: row.representative,
      city: row.city ?? null,
      remarks: row.remarks ?? "",
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch remarks per company"));
  }
};
