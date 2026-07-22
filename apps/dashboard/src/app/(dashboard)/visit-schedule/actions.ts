"use server";

import { Companies } from "@/db/schema/companies";
import { Contacts } from "@/db/schema/contacts";
import { VisitReports } from "@/db/schema/visit-reports";
import { db, SelectCompanies, SelectContacts } from "@/db";
import { and, asc, eq, max, min, or, sql } from "drizzle-orm";

export type VisitScheduleRow = Pick<
  SelectCompanies,
  | "companyName"
  | "accountManager"
  | "representative"
  | "customerGroup"
  | "region"
> &
  Pick<
    SelectContacts,
    | "targetYearRevenue"
    | "revenueLastYear"
    | "revenueThisYear"
    | "customerRegionCode"
    | "visitStreetAndNo"
    | "visitPostalCode"
    | "visitCity"
    | "visitCountry"
    | "visitTelephone"
  > & {
    companyUuid: SelectCompanies["uuid"];
    companyCode: SelectCompanies["id"];
    contactFirstName: SelectContacts["firstName"] | null;
    contactLastName: SelectContacts["lastName"] | null;
    contactEmail: SelectContacts["email"] | null;
    contactMobile: SelectContacts["mobile"] | null;
    lastCallDate: string | null;
    lastVisitDate: string | null;
    /**
     * No schema field stores a per-customer call/visit frequency target,
     * so there's nothing to compute an "upcoming" due-date from yet.
     */
    callUpcoming: string | null;
    visitUpcoming: string | null;
    callDue: boolean;
    visitDue: boolean;
  };

export const getVisitSchedule = async (): Promise<VisitScheduleRow[]> => {
  // Contact with the lowest id per company (id is a global PK, so matching
  // on it alone is enough to pick the right row) — same approach as
  // customers-and-prospects/actions.ts.
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
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
      email: Contacts.email,
      mobile: Contacts.mobile,
      customerRegionCode: Contacts.customerRegionCode,
      targetYearRevenue: Contacts.targetYearRevenue,
      revenueLastYear: Contacts.revenueLastYear,
      revenueThisYear: Contacts.revenueThisYear,
      // Fall back to the contact's main address/phone when no separate
      // visiting address was entered, so these columns still surface data.
      visitStreetAndNo: sql<
        string | null
      >`COALESCE(${Contacts.visitStreetAndNo}, ${Contacts.streetAndNo})`.as(
        "visit_street_and_no",
      ),
      visitPostalCode: sql<
        string | null
      >`COALESCE(${Contacts.visitPostalCode}, ${Contacts.postalCode})`.as(
        "visit_postal_code",
      ),
      visitCity: sql<
        string | null
      >`COALESCE(${Contacts.visitCity}, ${Contacts.city})`.as("visit_city"),
      visitCountry: sql<
        string | null
      >`COALESCE(${Contacts.visitCountry}, ${Contacts.addressCountry})`.as(
        "visit_country",
      ),
      visitTelephone: sql<
        string | null
      >`COALESCE(${Contacts.visitTelephone}, ${Contacts.addressTelephone}, ${Contacts.telephone})`.as(
        "visit_telephone",
      ),
    })
    .from(Contacts)
    .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
    .as("primary_contact");

  // Most recent completed phone contact per company.
  const lastCall = db
    .select({
      companyUuid: VisitReports.companyUuid,
      lastCallDate: max(VisitReports.visitDate).as("last_call_date"),
    })
    .from(VisitReports)
    .where(
      and(
        eq(VisitReports.contactMethod, "telephone_contact"),
        eq(VisitReports.hasTakenPlace, true),
      ),
    )
    .groupBy(VisitReports.companyUuid)
    .as("last_call");

  // Most recent completed in-person visit per company.
  const lastVisit = db
    .select({
      companyUuid: VisitReports.companyUuid,
      lastVisitDate: max(VisitReports.visitDate).as("last_visit_date"),
    })
    .from(VisitReports)
    .where(
      and(
        eq(VisitReports.contactMethod, "visit"),
        eq(VisitReports.hasTakenPlace, true),
      ),
    )
    .groupBy(VisitReports.companyUuid)
    .as("last_visit");

  const rows = await db
    .select({
      companyUuid: Companies.uuid,
      companyCode: Companies.id,
      companyName: Companies.companyName,
      accountManager: Companies.accountManager,
      representative: Companies.representative,
      customerGroup: Companies.customerGroup,
      region: Companies.region,
      contactFirstName: primaryContact.firstName,
      contactLastName: primaryContact.lastName,
      contactEmail: primaryContact.email,
      contactMobile: primaryContact.mobile,
      customerRegionCode: primaryContact.customerRegionCode,
      targetYearRevenue: primaryContact.targetYearRevenue,
      revenueLastYear: primaryContact.revenueLastYear,
      revenueThisYear: primaryContact.revenueThisYear,
      visitStreetAndNo: primaryContact.visitStreetAndNo,
      visitPostalCode: primaryContact.visitPostalCode,
      visitCity: primaryContact.visitCity,
      visitCountry: primaryContact.visitCountry,
      visitTelephone: primaryContact.visitTelephone,
      lastCallDate: lastCall.lastCallDate,
      lastVisitDate: lastVisit.lastVisitDate,
    })
    .from(Companies)
    .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
    .leftJoin(lastCall, eq(Companies.uuid, lastCall.companyUuid))
    .leftJoin(lastVisit, eq(Companies.uuid, lastVisit.companyUuid))
    .where(
      or(
        sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
        sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
      ),
    )
    .orderBy(asc(Companies.companyName));

  return rows.map(
    (row): VisitScheduleRow => ({
      companyUuid: row.companyUuid,
      companyCode: row.companyCode,
      companyName: row.companyName,
      accountManager: row.accountManager,
      representative: row.representative,
      customerGroup: row.customerGroup,
      region: row.region,
      contactFirstName: row.contactFirstName ?? null,
      contactLastName: row.contactLastName ?? null,
      contactEmail: row.contactEmail ?? null,
      contactMobile: row.contactMobile ?? null,
      customerRegionCode: row.customerRegionCode ?? null,
      targetYearRevenue: row.targetYearRevenue ?? null,
      revenueLastYear: row.revenueLastYear ?? null,
      revenueThisYear: row.revenueThisYear ?? null,
      visitStreetAndNo: row.visitStreetAndNo ?? null,
      visitPostalCode: row.visitPostalCode ?? null,
      visitCity: row.visitCity ?? null,
      visitCountry: row.visitCountry ?? null,
      visitTelephone: row.visitTelephone ?? null,
      lastCallDate: row.lastCallDate ?? null,
      lastVisitDate: row.lastVisitDate ?? null,
      callUpcoming: null,
      visitUpcoming: null,
      callDue: false,
      visitDue: false,
    }),
  );
};
