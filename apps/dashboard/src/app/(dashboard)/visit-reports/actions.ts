"use server";

import {
  Companies,
  Contacts,
  db,
  InsertVisitReports,
  SelectCompanies,
  SelectContacts,
  SelectVisitReports,
  VisitReports,
} from "@/db";
import { generateUuid, todayDateString } from "@/lib/helpers";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type VisitReportInput = Omit<
  InsertVisitReports,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type VisitReportActionResult = {
  error?: string;
};

export type VisitReportListItem = SelectVisitReports & {
  companyName: Pick<SelectCompanies, "companyName">["companyName"];
};

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "firstName" | "lastName"
>;

export type VisitReportDetail = VisitReportListItem & {
  companyId: SelectCompanies["id"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getVisitReports = async (): Promise<VisitReportListItem[]> =>
  db
    .select({
      ...getTableColumns(VisitReports),
      companyName: Companies.companyName,
    })
    .from(VisitReports)
    .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
    .orderBy(desc(VisitReports.createdAt));

/**
 * One visit report with the company visited and the contact seen.
 */
export const getVisitReportDetail = async (
  uuid: string,
): Promise<VisitReportDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(VisitReports),
      companyName: Companies.companyName,
      companyId: Companies.id,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(VisitReports)
    .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
    .leftJoin(Contacts, eq(Contacts.uuid, VisitReports.contactUuid))
    .where(eq(VisitReports.uuid, uuid))
    .limit(1);

  return row ?? null;
};

export const getContactsByCompanyUuid = async (
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
    .orderBy(asc(Contacts.lastName));

export const createVisitReport = async (
  input: VisitReportInput,
): Promise<VisitReportActionResult> => {
  const uuid = generateUuid();

  try {
    await db.insert(VisitReports).values({ ...input, uuid });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create visit report",
    };
  }

  redirect("/visit-reports");
};

// Resolves a planned visit/call: marks it as having taken place and stamps the
// visit date with today when it has none. A completed report is what the visit
// schedule, to-visit/call and customer-overview reports read for the "last
// visit / last call" dates and the visit count, so this is what turns a planned
// contact into a recorded one.
export const resolveVisitReport = async (
  uuid: string,
): Promise<VisitReportActionResult> => {
  try {
    const [report] = await db
      .select({
        uuid: VisitReports.uuid,
        hasTakenPlace: VisitReports.hasTakenPlace,
        visitDate: VisitReports.visitDate,
      })
      .from(VisitReports)
      .where(eq(VisitReports.uuid, uuid))
      .limit(1);

    if (!report) {
      return { error: "Visit report not found." };
    }
    if (report.hasTakenPlace) {
      return { error: "This visit report is already resolved." };
    }

    await db
      .update(VisitReports)
      .set({
        hasTakenPlace: true,
        visitDate: report.visitDate ?? todayDateString(),
      })
      .where(eq(VisitReports.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to resolve visit report",
    };
  }

  revalidatePath("/visit-reports");
  revalidatePath("/visit-schedule");
  revalidatePath("/change-visit-schedule");
  revalidatePath("/to-visit-call");
  revalidatePath("/customer-overview");
  return {};
};
