"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  SelectVisitReports,
  VisitReports,
} from "@/db/schema/visit-reports";
import { describeError } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

// A visit that actually happened, with the customer context a representative
// needs to read it: where they went, who they saw and which group the account
// belongs to.
export type VisitMadeRow = Pick<
  SelectVisitReports,
  | "uuid"
  | "representative"
  | "visitedBy"
  | "postalCode"
  | "city"
  | "visitDate"
  | "hasTakenPlace"
  | "visitReason"
  | "contactMethod"
  | "categories"
> & {
  customerCode: SelectCompanies["searchCode1"] | null;
  companyName: SelectCompanies["companyName"] | null;
  region: SelectCompanies["region"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

// Only visits that took place — a scheduled call that never happened belongs
// on the visit schedule, not in the record of what was done.
export const getVisitsMade = async (): Promise<VisitMadeRow[]> => {
  try {
    return await db
      .select({
        uuid: VisitReports.uuid,
        representative: VisitReports.representative,
        visitedBy: VisitReports.visitedBy,
        postalCode: VisitReports.postalCode,
        city: VisitReports.city,
        visitDate: VisitReports.visitDate,
        hasTakenPlace: VisitReports.hasTakenPlace,
        visitReason: VisitReports.visitReason,
        contactMethod: VisitReports.contactMethod,
        categories: VisitReports.categories,
        customerCode: Companies.searchCode1,
        companyName: Companies.companyName,
        region: Companies.region,
        customerGroup: Companies.customerGroup,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(VisitReports)
      .leftJoin(Companies, eq(VisitReports.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(VisitReports.contactUuid, Contacts.uuid))
      .where(eq(VisitReports.hasTakenPlace, true))
      .orderBy(desc(VisitReports.visitDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch visits made"));
  }
};
