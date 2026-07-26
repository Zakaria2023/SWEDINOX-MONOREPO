"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyRolesSchema, CompanyRolesFormValues } from "./validation";

export type CompanyRolesData = Pick<
  SelectCompanies,
  "uuid" | "companyName" | "roles"
>;

export type UpdateCompanyRolesPayload = CompanyRolesFormValues & {
  companyUuid: string;
};

export const getCompanyRoles = async (
  companyUuid: string,
): Promise<CompanyRolesData | null> => {
  const [company] = await db
    .select({
      uuid: Companies.uuid,
      companyName: Companies.companyName,
      roles: Companies.roles,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company ?? null;
};

// Updates only the roles column this section owns — other sections' fields
// (and all child collections) are untouched, so concurrent edits elsewhere
// can't be clobbered.
export const updateCompanyRoles = async (
  _prevState: CompanyActionResult,
  payload: UpdateCompanyRolesPayload,
): Promise<CompanyActionResult> => {
  const { companyUuid, ...values } = payload;
  const parsed = companyRolesSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid roles — select at least one role and try again" };
  }

  try {
    await db
      .update(Companies)
      .set({ roles: parsed.data.roles })
      .where(eq(Companies.uuid, companyUuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update company roles") };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyUuid}`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  revalidatePath(`/companies/${companyUuid}/edit/roles`);
  revalidatePath(`/companies/${companyUuid}/edit/full`);
  redirect(`/companies/${companyUuid}/edit`);
};
