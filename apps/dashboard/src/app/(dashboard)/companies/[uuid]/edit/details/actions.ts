"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { Companies, InsertCompanies } from "@/db/schema/companies";
import { requireAuth } from "@/lib/auth";
import { describeError } from "@/lib/helpers";
import {
  assertWorkPanelFree,
  releaseWorkPanelLockFor,
} from "@/lib/server/work-panel-locks";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyDetailsSchema, CompanyDetailsFormValues } from "./validation";

export type CompanyDetailsData = Pick<
  SelectCompanies,
  | "uuid"
  | "companyName"
  | "correspName"
  | "lang"
  | "remarks"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
>;

export type UpdateCompanyDetailsPayload = CompanyDetailsFormValues & {
  companyUuid: string;
};

export const getCompanyDetails = async (
  companyUuid: string,
): Promise<CompanyDetailsData | null> => {
  const [company] = await db
    .select({
      uuid: Companies.uuid,
      companyName: Companies.companyName,
      correspName: Companies.correspName,
      lang: Companies.lang,
      remarks: Companies.remarks,
      searchCode1: Companies.searchCode1,
      searchCode2: Companies.searchCode2,
      searchCode3: Companies.searchCode3,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company ?? null;
};

// Updates only the detail columns this section owns — other sections' fields
// (and all child collections) are untouched, so concurrent edits elsewhere
// can't be clobbered. An empty input intentionally clears its column.
export const updateCompanyDetails = async (
  _prevState: CompanyActionResult,
  payload: UpdateCompanyDetailsPayload,
): Promise<CompanyActionResult> => {
  const userId = await requireAuth();
  const { companyUuid, ...values } = payload;
  const parsed = companyDetailsSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Invalid company details — check the fields and try again",
    };
  }

  try {
    await db.transaction(async (tx) => {
      // Refused while someone else has the company open for editing.
      await assertWorkPanelFree(tx, "company", companyUuid, userId);

      await tx
        .update(Companies)
        .set({
          companyName: parsed.data.companyName,
          correspName: parsed.data.correspName || null,
          lang: (parsed.data.lang || null) as InsertCompanies["lang"],
          remarks: parsed.data.remarks || null,
          searchCode1: parsed.data.searchCode1 || null,
          searchCode2: parsed.data.searchCode2 || null,
          searchCode3: parsed.data.searchCode3 || null,
        })
        .where(eq(Companies.uuid, companyUuid));

      await releaseWorkPanelLockFor(tx, "company", companyUuid, userId);
    });
  } catch (error) {
    return { error: describeError(error, "Failed to update company details") };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyUuid}`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  redirect(`/companies/${companyUuid}/edit`);
};
