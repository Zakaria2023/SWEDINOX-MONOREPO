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
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
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

export const getVisitReports = async (): Promise<VisitReportListItem[]> =>
  db
    .select({
      ...getTableColumns(VisitReports),
      companyName: Companies.companyName,
    })
    .from(VisitReports)
    .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
    .orderBy(desc(VisitReports.createdAt));

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
