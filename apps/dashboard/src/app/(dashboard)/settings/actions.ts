"use server";

import { db } from "@/db";
import { BranchSettings } from "@/db/schema/branch-settings";
import { currentUserHasRole, requireAuth } from "@/lib/auth";
import { describeError } from "@/lib/helpers";
import {
  BRANCH_SETTINGS_ID,
  BranchSettingsValues,
  getBranchSettings,
} from "@/lib/server/branch-settings";
import { writeSystemLog } from "@/lib/server/system-log";
import { revalidatePath } from "next/cache";
import { branchSettingsSchema, BranchSettingsFormValues } from "./validation";

export type SettingsActionResult = {
  error?: string;
  success?: boolean;
};

/** The settings as the page shows them — re-exported for the client form. */
export type SettingsView = BranchSettingsValues;

export const getSettings = async (): Promise<SettingsView> =>
  getBranchSettings(db);

/**
 * Save the branch settings. An administrator's job, as the reference's
 * `Vestigingsgegevens` is — and every change is written to the system log, since
 * a changed threshold changes which orders are held from then on.
 */
export const updateBranchSettings = async (
  _prevState: SettingsActionResult,
  values: BranchSettingsFormValues,
): Promise<SettingsActionResult> => {
  const userId = await requireAuth();
  if (!(await currentUserHasRole(["admin"]))) {
    return { error: "Only an administrator can change the settings." };
  }

  const parsed = branchSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }
  const { overduePostBlockDays } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const before = await getBranchSettings(tx);

      await tx
        .insert(BranchSettings)
        .values({
          id: BRANCH_SETTINGS_ID,
          overduePostBlockDays,
          updatedByUserId: userId,
        })
        .onDuplicateKeyUpdate({
          set: { overduePostBlockDays, updatedByUserId: userId },
        });

      if (before.overduePostBlockDays !== overduePostBlockDays) {
        await writeSystemLog(tx, {
          category: "settings_changed",
          message: `Days overdue before a financial block changed from ${before.overduePostBlockDays} to ${overduePostBlockDays}`,
          userId,
        });
      }
    });
  } catch (error) {
    return { error: describeError(error, "Failed to save the settings") };
  }

  revalidatePath("/settings");
  revalidatePath("/system-log");
  return { success: true };
};
