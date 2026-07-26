"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db } from "@/db";
import {
  CustomerProjects,
  SelectCustomerProjects,
} from "@/db/schema/customer-projects";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { projectValuesToColumns } from "./mappers";
import { projectDialogSchema, ProjectDialogValues } from "./validation";

export type SaveProjectPayload = {
  companyUuid: string;
  projectUuid: string | null;
  values: ProjectDialogValues;
};

export type DeleteProjectPayload = {
  companyUuid: string;
  projectUuid: string;
};

const revalidateProjectPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/projects`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getProjectsForCompany = async (
  companyUuid: string,
): Promise<SelectCustomerProjects[]> =>
  await db
    .select()
    .from(CustomerProjects)
    .where(eq(CustomerProjects.companyUuid, companyUuid))
    .orderBy(asc(CustomerProjects.id));

// Inserts a new project or updates an existing one by uuid. New projects get
// the same defaults the legacy add handler applied: startingDate = today and
// daysInSystem = 0. Updates write only the dialog-editable columns.
export const saveCompanyProject = async (
  _prevState: CompanyActionResult,
  payload: SaveProjectPayload,
): Promise<CompanyActionResult> => {
  const parsed = projectDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid project data — check the fields and try again" };
  }

  try {
    const columns = projectValuesToColumns(parsed.data);

    if (payload.projectUuid) {
      await db
        .update(CustomerProjects)
        .set(columns)
        .where(
          and(
            eq(CustomerProjects.uuid, payload.projectUuid),
            eq(CustomerProjects.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(CustomerProjects).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
        startingDate: todayDateString(),
        daysInSystem: 0,
      });
    }

    revalidateProjectPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save project") };
  }
};

export const deleteCompanyProject = async (
  _prevState: CompanyActionResult,
  payload: DeleteProjectPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(CustomerProjects)
      .where(
        and(
          eq(CustomerProjects.uuid, payload.projectUuid),
          eq(CustomerProjects.companyUuid, payload.companyUuid),
        ),
      );

    revalidateProjectPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete project") };
  }
};
