"use server";

import {
  VisitReportActionResult,
  VisitReportInput,
} from "@/app/(dashboard)/visit-reports/actions";
import { formValuesToVisitReportInput } from "@/app/(dashboard)/visit-reports/mappers";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import {
  Companies,
  db,
  SelectCompanies,
  SelectVisitReports,
  VisitReports,
} from "@/db";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type VisitReportEditOverview = {
  report: SelectVisitReports;
  companyName: SelectCompanies["companyName"] | null;
  // Marketing and visit planning belong to the company; the overview links to
  // the company's own Marketing section for them.
  companyIndustry: SelectCompanies["industry"] | null;
  companyClassification: SelectCompanies["classification"] | null;
  companyNextVisitReason: SelectCompanies["visitReason"] | null;
  companyVisitPlanning: SelectCompanies["visitPlanning"] | null;
};

// Which columns each section owns, so saving one never carries a half-finished
// edit from another along with it.
const SECTION_COLUMNS = {
  report: [
    "companyUuid",
    "representative",
    "visitedBy",
    "contactMethod",
    "visitDate",
    "visitTime",
    "hasTakenPlace",
    "visitReason",
  ],
  addressAndContact: ["contactUuid"],
  details: ["attentionPoint", "remarks"],
  categories: ["categories"],
  readers: ["readers"],
} as const satisfies Record<string, readonly (keyof VisitReportInput)[]>;

const pickColumns = <K extends keyof VisitReportInput>(
  input: VisitReportInput,
  keys: readonly K[],
): Pick<VisitReportInput, K> =>
  Object.fromEntries(keys.map((key) => [key, input[key]])) as Pick<
    VisitReportInput,
    K
  >;

export const getVisitReportForEdit = async (
  uuid: string,
): Promise<SelectVisitReports | null> => {
  try {
    const [report] = await db
      .select()
      .from(VisitReports)
      .where(eq(VisitReports.uuid, uuid))
      .limit(1);

    return report ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the visit report"));
  }
};

export const getVisitReportEditOverview = async (
  uuid: string,
): Promise<VisitReportEditOverview | null> => {
  const [row] = await db
    .select({
      report: VisitReports,
      companyName: Companies.companyName,
      companyIndustry: Companies.industry,
      companyClassification: Companies.classification,
      companyNextVisitReason: Companies.visitReason,
      companyVisitPlanning: Companies.visitPlanning,
    })
    .from(VisitReports)
    .leftJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
    .where(eq(VisitReports.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    report: row.report,
    companyName: row.companyName ?? null,
    companyIndustry: row.companyIndustry ?? null,
    companyClassification: row.companyClassification ?? null,
    companyNextVisitReason: row.companyNextVisitReason ?? null,
    companyVisitPlanning: row.companyVisitPlanning ?? null,
  };
};

const saveSection = async (
  uuid: string,
  columns: Partial<VisitReportInput>,
): Promise<VisitReportActionResult> => {
  try {
    await db
      .update(VisitReports)
      .set(columns)
      .where(eq(VisitReports.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update visit report") };
  }

  // A resolved report is what the visit schedule, to-visit/call and customer
  // overview read for last-visit dates and visit counts, so every screen that
  // derives from one is refreshed together.
  revalidatePath("/visit-reports");
  revalidatePath("/visit-schedule");
  revalidatePath("/change-visit-schedule");
  revalidatePath("/to-visit-call");
  revalidatePath("/visits-made");
  revalidatePath("/customer-overview");
  revalidatePath(`/visit-reports/${uuid}/edit`);
  redirect(`/visit-reports/${uuid}/edit`);
};

export const updateVisitReportReport = async (
  uuid: string,
  values: VisitReportFormValues,
): Promise<VisitReportActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToVisitReportInput(values), SECTION_COLUMNS.report),
  );

export const updateVisitReportAddressAndContact = async (
  uuid: string,
  values: VisitReportFormValues,
): Promise<VisitReportActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToVisitReportInput(values),
      SECTION_COLUMNS.addressAndContact,
    ),
  );

export const updateVisitReportDetails = async (
  uuid: string,
  values: VisitReportFormValues,
): Promise<VisitReportActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToVisitReportInput(values), SECTION_COLUMNS.details),
  );

export const updateVisitReportCategories = async (
  uuid: string,
  values: VisitReportFormValues,
): Promise<VisitReportActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToVisitReportInput(values),
      SECTION_COLUMNS.categories,
    ),
  );

export const updateVisitReportReaders = async (
  uuid: string,
  values: VisitReportFormValues,
): Promise<VisitReportActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToVisitReportInput(values), SECTION_COLUMNS.readers),
  );
