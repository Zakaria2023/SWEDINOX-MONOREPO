"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { requireAuth } from "@/lib/auth";
import { Companies, InsertCompanies } from "@/db/schema/companies";
import {
  CompanyCompetitors,
  SelectCompanyCompetitors,
} from "@/db/schema/company-competitors";
import { describeError, generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  companyMarketingSchema,
  CompanyMarketingFormValues,
} from "./validation";

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
  const userId = await requireAuth();
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
        modifiedByUserId: userId,
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
  redirect(`/companies/${companyUuid}/edit`);
};


export type CompanyCompetitorInput = {
  firm: string;
  revenueSharePercent: string;
  customerSatisfaction: string;
  remarks: string;
};

/**
 * Who else sells to this customer.
 *
 * Lives on Marketing rather than on the order the reference shows it from: a
 * rival's share of a customer's spend belongs to the relationship, and it is
 * marketing who would know it. The order's own `Competitors` panel reads the
 * same rows through the company.
 */
export const getCompanyCompetitors = async (
  companyUuid: string,
): Promise<SelectCompanyCompetitors[]> => {
  await requireAuth();
  return db
    .select()
    .from(CompanyCompetitors)
    .where(eq(CompanyCompetitors.companyUuid, companyUuid))
    .orderBy(desc(CompanyCompetitors.revenueSharePercent));
};

/**
 * Replace the whole list in one go.
 *
 * A handful of rows edited together as a block, so a diff would be more
 * machinery than the thing is worth — and a replace cannot leave the list half
 * saved, which a row-by-row update can.
 *
 * Rows with no firm name are dropped rather than rejected: an empty row at the
 * bottom of a form is somebody who stopped typing, not an error worth refusing
 * the save over.
 */
export const saveCompanyCompetitors = async (
  companyUuid: string,
  rows: CompanyCompetitorInput[],
): Promise<CompanyActionResult> => {
  await requireAuth();
  try {
    const named = rows.filter((row) => row.firm.trim());

    await db.transaction(async (tx) => {
      await tx
        .delete(CompanyCompetitors)
        .where(eq(CompanyCompetitors.companyUuid, companyUuid));

      if (named.length === 0) {
        return;
      }

      await tx.insert(CompanyCompetitors).values(
        named.map((row) => ({
          uuid: generateUuid(),
          companyUuid,
          firm: row.firm.trim(),
          revenueSharePercent: row.revenueSharePercent.trim()
            ? Number(row.revenueSharePercent.replace(",", ".")).toFixed(2)
            : null,
          customerSatisfaction: row.customerSatisfaction.trim() || null,
          remarks: row.remarks.trim() || null,
        })),
      );
    });

    revalidatePath(`/companies/${companyUuid}/edit/marketing`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save the competitors") };
  }
};
