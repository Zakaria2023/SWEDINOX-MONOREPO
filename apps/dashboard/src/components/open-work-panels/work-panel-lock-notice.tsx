"use client";

import { useEffect, useState } from "react";
import {
  acquireWorkPanelLock,
  releaseWorkPanelLock,
  WorkPanelLockState,
} from "@/app/(dashboard)/open-work-panels/actions";
import { WorkPanelType } from "@/lib/enums";

type Props = {
  panelType: WorkPanelType;
  recordUuid: string;
  /** What the Open work panels screen shows for this record. */
  description: string;
};

// Takes the record's lock while this edit screen is open and gives it back when
// the screen closes. When somebody else already holds it, says who — their save
// wins until they close it, and ours would be refused.
export const WorkPanelLockNotice = ({
  panelType,
  recordUuid,
  description,
}: Props) => {
  const [lock, setLock] = useState<WorkPanelLockState | null>(null);

  useEffect(() => {
    const subscription = { active: true };
    acquireWorkPanelLock(panelType, recordUuid, description)
      .then((state) => {
        if (subscription.active) {
          setLock(state);
        }
      })
      .catch(() => undefined);

    return () => {
      subscription.active = false;
      releaseWorkPanelLock(panelType, recordUuid).catch(() => undefined);
    };
  }, [panelType, recordUuid, description]);

  if (!lock?.heldByOther) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {lock.holderName} has this record open for editing since {lock.openedAt}.
      Saving is refused until they close it, or an administrator removes the
      lock on Open work panels.
    </div>
  );
};
