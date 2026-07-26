"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { Companies, InsertCompanies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyMarketingSchema, CompanyMarketingFormValues } from "./validation";

export type CompanyMarketingData = Pick<
  SelectCompanies,
  | "uuid"
  | "companyName"
  | "industry"
  | "classification"
  | "visitFrequency"
  | "callFrequencyPerYear"
  | "targetDateNextVisit"
  | "visitReason"
  | "potentialAnnualRevenue"
  | "targetAnnualRevenue"
  | "potentialAnnualSales"
  | "targetAnnualSales"
  | "numberOfEmployees"
  | "visitPlanning"
>;

export type UpdateCompanyMarketingPayload = CompanyMarketingFormValues & {
  companyUuid: string;
};

export const getCompanyMarketing = async (
  companyUuid: string,
): Promise<CompanyMarketingData | null> => {
  const [company] = await db
    .select({
      uuid: Companies.uuid,
      companyName: Companies.companyName,
      industry: Companies.industry,
      classification: Companies.classification,
      visitFrequency: Companies.visitFrequency,
      callFrequencyPerYear: Companies.callFrequencyPerYear,
      targetDateNextVisit: Companies.targetDateNextVisit,
      visitReason: Companies.visitReason,
      potentialAnnualRevenue: Companies.potentialAnnualRevenue,
      targetAnnualRevenue: Companies.targetAnnualRevenue,
      potentialAnnualSales: Companies.potentialAnnualSales,
      targetAnnualSales: Companies.targetAnnualSales,
      numberOfEmployees: Companies.numberOfEmployees,
      visitPlanning: Companies.visitPlanning,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company ?? null;
};

// Updates only the marketing columns this section owns — other sections'
// fields (and all child collections) are untouched, so concurrent edits
// elsewhere can't be clobbered. An empty input intentionally clears its
// column; numeric strings convert exactly as the legacy submit hook did.
export const updateCompanyMarketing = async (
  _prevState: CompanyActionResult,
  payload: UpdateCompanyMarketingPayload,
): Promise<CompanyActionResult> => {
  const { companyUuid, ...values } = payload;
  const parsed = companyMarketingSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Invalid marketing settings — check the fields and try again",
    };
  }

  try {
    await db
      .update(Companies)
      .set({
        industry: parsed.data.industry || null,
        classification: (parsed.data.classification ||
          null) as InsertCompanies["classification"],
        visitFrequency: parsed.data.visitFrequency
          ? Number(parsed.data.visitFrequency)
          : null,
        callFrequencyPerYear: parsed.data.callFrequencyPerYear
          ? Number(parsed.data.callFrequencyPerYear)
          : null,
        targetDateNextVisit: parsed.data.targetDateNextVisit
          ? new Date(parsed.data.targetDateNextVisit)
          : null,
        visitReason: (parsed.data.visitReason ||
          null) as InsertCompanies["visitReason"],
        potentialAnnualRevenue: parsed.data.potentialAnnualRevenue
          ? String(parsed.data.potentialAnnualRevenue)
          : null,
        targetAnnualRevenue: parsed.data.targetAnnualRevenue
          ? String(parsed.data.targetAnnualRevenue)
          : null,
        potentialAnnualSales: parsed.data.potentialAnnualSales
          ? String(parsed.data.potentialAnnualSales)
          : null,
        targetAnnualSales: parsed.data.targetAnnualSales
          ? String(parsed.data.targetAnnualSales)
          : null,
        numberOfEmployees: parsed.data.numberOfEmployees
          ? Number(parsed.data.numberOfEmployees)
          : null,
        visitPlanning: parsed.data.visitPlanning,
      })
      .where(eq(Companies.uuid, companyUuid));
  } catch (error) {
    return {
      error: describeError(error, "Failed to update marketing settings"),
    };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyUuid}`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  revalidatePath(`/companies/${companyUuid}/edit/marketing`);
  revalidatePath(`/companies/${companyUuid}/edit/full`);
  redirect(`/companies/${companyUuid}/edit`);
};
