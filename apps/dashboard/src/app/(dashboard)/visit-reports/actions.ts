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
import { generateUuid } from "@/lib/helpers";
import { asc, count, desc, eq } from "drizzle-orm";
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

export const getVisitReports = async (): Promise<VisitReportListItem[]> => {
  const rows = await db
    .select({
      visitReport: VisitReports,
      companyName: Companies.companyName,
    })
    .from(VisitReports)
    .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
    .orderBy(desc(VisitReports.createdAt));

  return rows.map((row) => ({
    ...row.visitReport,
    companyName: row.companyName,
  }));
};

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "firstName" | "lastName"
>;

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

export const getVisitCountsByCompany = async (): Promise<
  Map<string, number>
> => {
  const rows = await db
    .select({ companyUuid: VisitReports.companyUuid, value: count() })
    .from(VisitReports)
    .groupBy(VisitReports.companyUuid);
  return new Map(rows.map((row) => [row.companyUuid, row.value] as const));
};

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
