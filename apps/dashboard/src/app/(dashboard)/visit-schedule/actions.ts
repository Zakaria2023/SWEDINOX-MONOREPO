"use server";

import { Companies } from "@/db/schema/companies";
import { Contacts } from "@/db/schema/contacts";
import { VisitReports } from "@/db/schema/visit-reports";
import { db, SelectCompanies, SelectCompanyAddresses, SelectContacts } from "@/db";
import {
  contactIntervalWeeks,
  isContactDue,
  nextContactDate,
  todayDateString,
} from "@/lib/helpers";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { companyRevenueByYear } from "@/lib/server/customer-revenue";
import { and, asc, eq, max, min, or, sql } from "drizzle-orm";

export type VisitScheduleRow = Pick<
  SelectCompanies,
  | "companyName"
  | "accountManager"
  | "representative"
  | "customerGroup"
  | "region"
> &
  {
    companyUuid: SelectCompanies["uuid"];
    /** Invoiced revenue excl. VAT, from the company's invoices. */
    revenueLastYear: number;
    revenueThisYear: number;
    companyCode: SelectCompanies["id"];
    visitStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
    visitPostalCode: SelectCompanyAddresses["postalCode"] | null;
    visitCity: SelectCompanyAddresses["city"] | null;
    visitCountry: SelectCompanyAddresses["country"] | null;
    visitTelephone: SelectCompanyAddresses["telephone"] | null;
    contactFirstName: SelectContacts["firstName"] | null;
    contactLastName: SelectContacts["lastName"] | null;
    contactEmail: SelectContacts["email"] | null;
    contactMobile: SelectContacts["mobile"] | null;
    lastCallDate: string | null;
    lastVisitDate: string | null;
    /**
     * When the next call and the next visit are due: the last one plus the
     * interval the customer's own frequency asks for, or the one its A/B/C
     * classification implies where no frequency was typed. A customer nobody
     * has ever called is due now rather than never; one with neither a
     * frequency nor a classification has no due date at all, which keeps it off
     * the list instead of on it every day.
     */
    callUpcoming: string | null;
    visitUpcoming: string | null;
    callDue: boolean;
    visitDue: boolean;
  };

export const getVisitSchedule = async (): Promise<VisitScheduleRow[]> => {
  // Contact with the lowest id per company — the reference's visit screens
  // take the first contact too (C13 §41). Only the contact's own columns come
  // from it.
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
    })
    .from(Contacts)
    .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
    .as("primary_contact");

  // The visiting address is the company's — 2 531 of 2 531 rows in the
  // reference's Visit schedule equal the company's visiting-address row.
  const visiting = companyAddressFor("visit", "visiting_address");
  const revenue = companyRevenueByYear("company_revenue");

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
      classification: Companies.classification,
      visitFrequency: Companies.visitFrequency,
      callFrequencyPerYear: Companies.callFrequencyPerYear,
      contactFirstName: primaryContact.firstName,
      contactLastName: primaryContact.lastName,
      contactEmail: primaryContact.email,
      contactMobile: primaryContact.mobile,
      revenueLastYear: revenue.revenueLastYear,
      revenueThisYear: revenue.revenueThisYear,
      visitStreetAndNo: visiting.streetAndNo,
      visitPostalCode: visiting.postalCode,
      visitCity: visiting.city,
      visitCountry: visiting.country,
      visitTelephone: visiting.telephone,
      lastCallDate: lastCall.lastCallDate,
      lastVisitDate: lastVisit.lastVisitDate,
    })
    .from(Companies)
    .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
    .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
    .leftJoin(revenue, eq(Companies.uuid, revenue.companyUuid))
    .leftJoin(lastCall, eq(Companies.uuid, lastCall.companyUuid))
    .leftJoin(lastVisit, eq(Companies.uuid, lastVisit.companyUuid))
    .where(
      or(
        sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
        sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
      ),
    )
    .orderBy(asc(Companies.companyName));

  const today = todayDateString();

  return rows.map((row): VisitScheduleRow => {
    const callInterval = contactIntervalWeeks("telephone_contact", {
      classification: row.classification,
      callsPerYear: row.callFrequencyPerYear,
    });
    const visitInterval = contactIntervalWeeks("visit", {
      classification: row.classification,
      visitsPerYear: row.visitFrequency,
    });
    const callUpcoming = nextContactDate(row.lastCallDate, callInterval, today);
    const visitUpcoming = nextContactDate(
      row.lastVisitDate,
      visitInterval,
      today,
    );

    return {
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
      revenueLastYear: Number(row.revenueLastYear ?? 0),
      revenueThisYear: Number(row.revenueThisYear ?? 0),
      visitStreetAndNo: row.visitStreetAndNo ?? null,
      visitPostalCode: row.visitPostalCode ?? null,
      visitCity: row.visitCity ?? null,
      visitCountry: row.visitCountry ?? null,
      visitTelephone: row.visitTelephone ?? null,
      lastCallDate: row.lastCallDate ?? null,
      lastVisitDate: row.lastVisitDate ?? null,
      callUpcoming,
      visitUpcoming,
      callDue: isContactDue(callUpcoming, today),
      visitDue: isContactDue(visitUpcoming, today),
    };
  });
};
