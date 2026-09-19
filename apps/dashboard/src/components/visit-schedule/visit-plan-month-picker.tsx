"use client";

import { Select } from "@/components/shadcn/select";
import { useTableQuery } from "@/hooks/use-table-query";
import { MONTH_LABELS } from "@/lib/labels";

type Props = {
  year: number;
  month: number;
};

// Five years back and one forward. A plan is made for the month ahead and read
// back for the ones behind; nobody schedules a call for 2031.
const YEAR_SPAN = 5;

/**
 * Which month the plan columns belong to.
 *
 * It lives in the URL beside the search and the filters rather than in state,
 * so a link to "September, everything unplanned, region NL-1" opens on exactly
 * that. Changing the month sends the reader back to page one: the rows are the
 * same but what is ticked on them is not, and page four of a different question
 * is not an answer.
 */
export const VisitPlanMonthPicker = ({ year, month }: Props) => {
  const { setParams, isPending } = useTableQuery();
  const thisYear = new Date().getFullYear();
  const years = Array.from(
    { length: YEAR_SPAN + 2 },
    (_, index) => thisYear + 1 - index,
  );

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="visit-plan-month"
          className="text-xs font-medium text-muted-foreground"
        >
          Month
        </label>
        <Select
          id="visit-plan-month"
          className="h-8 min-w-36"
          disabled={isPending}
          value={String(month)}
          onValueChange={(next) => setParams({ month: next, page: null })}
          options={MONTH_LABELS.map((label, index) => ({
            value: String(index + 1),
            label,
          }))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="visit-plan-year"
          className="text-xs font-medium text-muted-foreground"
        >
          Year
        </label>
        <Select
          id="visit-plan-year"
          className="h-8 min-w-24"
          disabled={isPending}
          value={String(year)}
          onValueChange={(next) => setParams({ year: next, page: null })}
          options={years.map((value) => ({
            value: String(value),
            label: String(value),
          }))}
        />
      </div>
    </div>
  );
};
