"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db } from "@/db";
import { FollowUps, SelectFollowUps } from "@/db/schema/follow-ups";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { followUpRowSchema, FollowUpRowValues } from "./validation";

export type SaveFollowUpPayload = {
  companyUuid: string;
  followUpUuid: string | null;
  values: FollowUpRowValues;
};

export type DeleteFollowUpPayload = {
  companyUuid: string;
  followUpUuid: string;
};

const revalidateFollowUpPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/follow-ups`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getFollowUpsForCompany = async (
  companyUuid: string,
): Promise<SelectFollowUps[]> =>
  await db
    .select()
    .from(FollowUps)
    .where(eq(FollowUps.companyUuid, companyUuid))
    .orderBy(asc(FollowUps.id));

// Inserts a new follow-up or updates an existing one by uuid. Inserts persist
// the auto-filled `date` and `by` values the draft row carries (today's date
// and the current user's name — the same defaults the legacy addFollowUp
// handler applied); updates write only the inline-editable columns, so those
// creation-time values never change afterwards.
export const saveCompanyFollowUp = async (
  _prevState: CompanyActionResult,
  payload: SaveFollowUpPayload,
): Promise<CompanyActionResult> => {
  const parsed = followUpRowSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid follow-up data — check the fields and try again" };
  }

  try {
    if (payload.followUpUuid) {
      await db
        .update(FollowUps)
        .set({
          contactPerson: parsed.data.contactPerson || null,
          text: parsed.data.text || null,
          completed: parsed.data.completed,
        })
        .where(
          and(
            eq(FollowUps.uuid, payload.followUpUuid),
            eq(FollowUps.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(FollowUps).values({
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
        date: parsed.data.date || null,
        by: parsed.data.by || null,
        contactPerson: parsed.data.contactPerson || null,
        text: parsed.data.text || null,
        completed: parsed.data.completed,
      });
    }

    revalidateFollowUpPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save follow-up") };
  }
};

export const deleteCompanyFollowUp = async (
  _prevState: CompanyActionResult,
  payload: DeleteFollowUpPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(FollowUps)
      .where(
        and(
          eq(FollowUps.uuid, payload.followUpUuid),
          eq(FollowUps.companyUuid, payload.companyUuid),
        ),
      );

    revalidateFollowUpPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete follow-up") };
  }
};
