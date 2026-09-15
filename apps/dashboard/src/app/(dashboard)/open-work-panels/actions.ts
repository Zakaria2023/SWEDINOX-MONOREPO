"use server";

import { db } from "@/db";
import {
  SelectWorkPanelLocks,
  WorkPanelLocks,
} from "@/db/schema/work-panel-locks";
import { currentUserHasRole, requireAuth } from "@/lib/auth";
import { WorkPanelType, workPanelTypes } from "@/lib/enums";
import { describeError, generateUuid } from "@/lib/helpers";
import { WORK_PANEL_TYPE_LABELS } from "@/lib/labels";
import { getClerkUserNames } from "@/lib/server/clerk";
import { writeSystemLog } from "@/lib/server/system-log";
import { releaseWorkPanelLockFor } from "@/lib/server/work-panel-locks";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type WorkPanelLockRow = Pick<
  SelectWorkPanelLocks,
  "uuid" | "panelType" | "recordUuid" | "description" | "userId" | "openedAt"
>;

export type WorkPanelLockState = {
  /** Somebody other than the current user has the record open. */
  heldByOther: boolean;
  holderName: string | null;
  /** When they opened it, formatted for display. */
  openedAt: string | null;
};

export type WorkPanelActionResult = {
  error?: string;
  success?: boolean;
};

const isWorkPanelType = (value: string): value is WorkPanelType =>
  workPanelTypes.some((type) => type === value);

export const getOpenWorkPanels = async (): Promise<WorkPanelLockRow[]> => {
  try {
    return await db
      .select({
        uuid: WorkPanelLocks.uuid,
        panelType: WorkPanelLocks.panelType,
        recordUuid: WorkPanelLocks.recordUuid,
        description: WorkPanelLocks.description,
        userId: WorkPanelLocks.userId,
        openedAt: WorkPanelLocks.openedAt,
      })
      .from(WorkPanelLocks)
      .orderBy(desc(WorkPanelLocks.openedAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch open work panels"));
  }
};

/**
 * Open a record for editing: take its lock, or report who already has it.
 *
 * A lock that is already this user's is kept — the same person opening the same
 * record in a second tab is not a conflict.
 */
export const acquireWorkPanelLock = async (
  panelType: string,
  recordUuid: string,
  description: string,
): Promise<WorkPanelLockState> => {
  const userId = await requireAuth();
  if (!isWorkPanelType(panelType)) {
    throw new Error(`Unknown work panel type: ${panelType}`);
  }

  // Inserting against the unique (type, record) index either takes the lock or
  // leaves the holder's row untouched; reading it back says which.
  await db
    .insert(WorkPanelLocks)
    .values({
      uuid: generateUuid(),
      panelType,
      recordUuid,
      description: description.slice(0, 255),
      userId,
    })
    .onDuplicateKeyUpdate({ set: { recordUuid } });

  const [lock] = await db
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
    return { heldByOther: false, holderName: null, openedAt: null };
  }

  const names = await getClerkUserNames();
  return {
    heldByOther: true,
    holderName: names[lock.userId] ?? "another user",
    openedAt: lock.openedAt.toLocaleString("en-GB"),
  };
};

/** Close the panel: give up this user's own lock. */
export const releaseWorkPanelLock = async (
  panelType: string,
  recordUuid: string,
): Promise<void> => {
  const userId = await requireAuth();
  if (!isWorkPanelType(panelType)) {
    return;
  }
  await releaseWorkPanelLockFor(db, panelType, recordUuid, userId);
};

/**
 * Remove somebody's lock — the reference's `Delete Lock`, for a panel left open
 * by a closed browser or a person who has gone home. An administrator's action,
 * and logged, because it lets another user overwrite work in progress.
 */
export const deleteWorkPanelLock = async (
  lockUuid: string,
): Promise<WorkPanelActionResult> => {
  const userId = await requireAuth();
  if (!(await currentUserHasRole(["admin"]))) {
    return { error: "Only an administrator can remove a lock." };
  }

  try {
    const [lock] = await db
      .select({
        panelType: WorkPanelLocks.panelType,
        recordUuid: WorkPanelLocks.recordUuid,
        description: WorkPanelLocks.description,
        userId: WorkPanelLocks.userId,
      })
      .from(WorkPanelLocks)
      .where(eq(WorkPanelLocks.uuid, lockUuid))
      .limit(1);

    if (!lock) {
      return { error: "This lock was already removed." };
    }

    const names = await getClerkUserNames();
    await db.transaction(async (tx) => {
      await tx.delete(WorkPanelLocks).where(eq(WorkPanelLocks.uuid, lockUuid));
      await writeSystemLog(tx, {
        category: "lock_removed",
        message: `Lock on ${WORK_PANEL_TYPE_LABELS[lock.panelType].toLowerCase()} "${lock.description ?? lock.recordUuid}" held by ${names[lock.userId] ?? "another user"} removed`,
        orderUuid: lock.panelType === "order" ? lock.recordUuid : null,
        userId,
      });
    });
  } catch (error) {
    return { error: describeError(error, "Failed to remove the lock") };
  }

  revalidatePath("/open-work-panels");
  revalidatePath("/system-log");
  return { success: true };
};
