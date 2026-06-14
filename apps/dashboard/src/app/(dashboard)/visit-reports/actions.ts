"use server";

import {
  Companies,
  db,
  VisitReports,
  type InsertVisitReports,
  type SelectCompanies,
  type SelectVisitReports,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type VisitReportInput = Omit<
  InsertVisitReports,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type VisitReportActionResult = {
  error?: string;
  success?: boolean;
  visitReportUuid?: string;
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

export const createVisitReport = async (
  input: VisitReportInput,
): Promise<VisitReportActionResult> => {
  const uuid = generateUuid();

  try {
    await db.insert(VisitReports).values({ ...input, uuid });
    return { success: true, visitReportUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create visit report",
    };
  }
};
