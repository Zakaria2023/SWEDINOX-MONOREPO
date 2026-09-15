import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { RevenueVsBudgetView, revenueVsBudgetViews } from "@/lib/enums";
import { REVENUE_VS_BUDGET_VIEW_LABELS } from "@/lib/labels";

type Props = {
  /** The page the filter submits to, as a plain GET. */
  action: string;
  year: number;
  month: number | null;
  /** Leave out on a page with only one view. */
  view?: RevenueVsBudgetView;
  /** Hide the month on a page that works by the year. */
  showMonth?: boolean;
};

// Year and month, and the view where there is a choice. Submitted as query
// parameters so the period is part of the address and survives a refresh.
export const PeriodFilter = ({
  action,
  year,
  month,
  view,
  showMonth = true,
}: Props) => (
  <form
    method="get"
    action={action}
    className="flex flex-wrap items-end gap-4 rounded-lg border border-border p-4"
  >
    <div className="space-y-1">
      <FormLabel htmlFor="year">Year</FormLabel>
      <Input
        id="year"
        name="year"
        type="number"
        min={2000}
        max={2100}
        defaultValue={year}
        className="w-28"
      />
    </div>
    {showMonth ? (
      <div className="space-y-1">
        <FormLabel htmlFor="month">Month (blank for the whole year)</FormLabel>
        <Input
          id="month"
          name="month"
          type="number"
          min={1}
          max={12}
          defaultValue={month ?? ""}
          className="w-28"
        />
      </div>
    ) : null}
    {view ? (
      <div className="space-y-1">
        <FormLabel htmlFor="view">View</FormLabel>
        <select
          id="view"
          name="view"
          defaultValue={view}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          {revenueVsBudgetViews.map((option) => (
            <option key={option} value={option}>
              {REVENUE_VS_BUDGET_VIEW_LABELS[option]}
            </option>
          ))}
        </select>
      </div>
    ) : null}
    <Button type="submit">Show Data</Button>
  </form>
);
