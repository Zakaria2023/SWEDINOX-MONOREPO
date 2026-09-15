import "server-only";

import { db } from "@/db";
import { WorkPanelLocks } from "@/db/schema/work-panel-locks";
import { WorkPanelType } from "@/lib/enums";
import { WORK_PANEL_TYPE_LABELS } from "@/lib/labels";
import { getClerkUserNames } from "@/lib/server/clerk";
import { and, eq } from "drizzle-orm";

type LockQuery = Pick<typeof db, "select" | "delete">;

/**
 * Refuse a save while somebody else has the record open. The reference locks a
 * record for as long as its panel is open; a save that ignored the lock would
 * silently overwrite the other person's work.
 */
export const assertWorkPanelFree = async (
  tx: LockQuery,
  panelType: WorkPanelType,
  recordUuid: string,
  userId: string,
): Promise<void> => {
  const [lock] = await tx
    .select({
      userId: WorkPanelLocks.userId,
      openedAt: WorkPanelLocks.openedAt,
    })
    .from(WorkPanelLocks)
    .where(
      and(
        eq(WorkPanelLocks.panelType, panelType),
        eq(WorkPanelLocks.recordUuid, recordUuid),
      ),
    )
    .limit(1);

  if (!lock || lock.userId === userId) {
    return;
  }

  const names = await getClerkUserNames();
  const holder = names[lock.userId] ?? "another user";
  throw new Error(
    `This ${WORK_PANEL_TYPE_LABELS[panelType].toLowerCase()} is open for editing by ${holder} since ${lock.openedAt.toLocaleString("en-GB")}. Ask them to close it, or remove the lock on Open work panels.`,
  );
};

/** Close the panel: give up this user's own lock on the record, if held. */
export const releaseWorkPanelLockFor = async (
  tx: LockQuery,
  panelType: WorkPanelType,
  recordUuid: string,
  userId: string,
): Promise<void> => {
  await tx
    .delete(WorkPanelLocks)
    .where(
      and(
        eq(WorkPanelLocks.panelType, panelType),
        eq(WorkPanelLocks.recordUuid, recordUuid),
        eq(WorkPanelLocks.userId, userId),
      ),
    );
};
