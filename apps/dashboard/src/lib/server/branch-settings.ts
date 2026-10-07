import "server-only";

import { db } from "@/db";
import { BranchSettings, SelectBranchSettings } from "@/db/schema/branch-settings";
import { OVERDUE_POST_BLOCK_DAYS } from "@/lib/helpers";
import { eq } from "drizzle-orm";

type SettingsReader = Pick<typeof db, "select">;

export type BranchSettingsValues = Pick<
  SelectBranchSettings,
  "overduePostBlockDays" | "affiliateName" | "updatedByUserId" | "updatedAt"
>;

/** The one settings row. */
export const BRANCH_SETTINGS_ID = 1;

/**
 * The branch's settings, or the defaults when none have been saved yet — a
 * missing row must never stop the credit rule from running.
 */
export const getBranchSettings = async (
  tx: SettingsReader,
): Promise<BranchSettingsValues> => {
  const [row] = await tx
    .select({
      overduePostBlockDays: BranchSettings.overduePostBlockDays,
      affiliateName: BranchSettings.affiliateName,
      updatedByUserId: BranchSettings.updatedByUserId,
      updatedAt: BranchSettings.updatedAt,
    })
    .from(BranchSettings)
    .where(eq(BranchSettings.id, BRANCH_SETTINGS_ID))
    .limit(1);

  return (
    row ?? {
      overduePostBlockDays: OVERDUE_POST_BLOCK_DAYS,
      affiliateName: null,
      updatedByUserId: null,
      updatedAt: new Date(0),
    }
  );
};
