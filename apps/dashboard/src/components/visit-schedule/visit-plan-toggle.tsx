"use client";

import { useActionState, useEffect, useState } from "react";
import { setVisitPlan } from "@/app/(dashboard)/change-visit-schedule/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { VisitReportContactMethod } from "@/lib/enums";

type Props = {
  companyUuid: string;
  companyName: string | null;
  year: number;
  month: number;
  kind: VisitReportContactMethod;
  planned: boolean;
};

/**
 * One tick box on `Change visit schedule`.
 *
 * It shows the new state immediately and saves behind it, because a grid of two
 * and a half thousand rows is ticked in runs and waiting for a round trip
 * between each one would make planning a region unbearable. If the save fails
 * the box goes back to what the server still holds, so the screen never claims
 * a plan that was not written.
 */
export const VisitPlanToggle = ({
  companyUuid,
  companyName,
  year,
  month,
  kind,
  planned,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(setVisitPlan, {});
  const [checked, setChecked] = useState(planned);

  // The row re-renders with the saved value once the path revalidates, and it
  // is that value — not the click — that the box should end up showing.
  useEffect(() => {
    setChecked(planned);
  }, [planned]);

  useEffect(() => {
    if (state.error) {
      setChecked(planned);
    }
  }, [state.error, planned]);

  return (
    <Checkbox
      checked={checked}
      disabled={isPending}
      aria-label={
        kind === "visit"
          ? `Plan a visit to ${companyName ?? "this company"}`
          : `Plan a call to ${companyName ?? "this company"}`
      }
      onChange={(event) => {
        const next = event.target.checked;
        setChecked(next);
        dispatch({ companyUuid, year, month, kind, planned: next });
      }}
    />
  );
};
