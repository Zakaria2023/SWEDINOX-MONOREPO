"use server";

import { revalidatePath } from "next/cache";
import {
  VisitPlanInput,
  visitPlanSchema,
} from "@/app/(dashboard)/change-visit-schedule/validation";
import { db } from "@/db";
import { VisitPlans } from "@/db/schema/visit-plans";
import { requireAuth } from "@/lib/auth";
import { describeError, generateUuid } from "@/lib/helpers";

export type VisitPlanActionResult = {
  error?: string;
  success?: boolean;
};

/**
 * Tick or untick one box — a call or a visit — for one company in one month.
 *
 * Upserted, because the unique key is the company and the month: ticking
 * `Call`, then `Visit`, then `Call` again on the same row is three edits of one
 * plan, not three plans.
 *
 * Only the box that moved is written. Sending both would mean every checkbox
 * carrying its own copy of the other one, and two checkboxes ticked in quick
 * succession would each save the value the page was rendered with — the second
 * quietly undoing the first.
 */
export const setVisitPlan = async (
  _prevState: VisitPlanActionResult,
  input: VisitPlanInput,
): Promise<VisitPlanActionResult> => {
  const userId = await requireAuth();

  const parsed = visitPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That plan could not be saved." };
  }

  const { companyUuid, year, month, kind, planned } = parsed.data;
  const changed = kind === "visit" ? { visit: planned } : { call: planned };

  try {
    await db
      .insert(VisitPlans)
      .values({
        uuid: generateUuid(),
        companyUuid,
        planYear: year,
        planMonth: month,
        // The box nobody touched starts unticked, which is what no row at all
        // already meant.
        call: false,
        visit: false,
        ...changed,
        plannedByUserId: userId,
      })
      .onDuplicateKeyUpdate({
        set: { ...changed, plannedByUserId: userId },
      });
  } catch (error) {
    return { error: describeError(error, "Failed to save the plan") };
  }

  revalidatePath("/change-visit-schedule");
  revalidatePath("/visit-schedule");
  return { success: true };
};
