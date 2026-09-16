import { getRevenueVsBudget } from "@/app/(dashboard)/revenue-vs-budget/actions";
import { RevenueVsBudgetTable } from "@/components/revenue-vs-budget/revenue-vs-budget-table-content";
import { PeriodFilter } from "@/components/revenue-vs-budget/period-filter";
import { RevenueVsBudgetView, revenueVsBudgetViews } from "@/lib/enums";
import { parseMonthParam, parseYearParam } from "@/lib/helpers";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ year?: string; month?: string; view?: string }>;
};

const RevenueVsBudgetPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  // As in the reference, a blank year means the current one.
  const year = parseYearParam(params.year);
  const month = parseMonthParam(params.month);
  const view =
    revenueVsBudgetViews.find(
      (value): value is RevenueVsBudgetView => value === params.view,
    ) ?? "revenue_group";

  const rows = await getRevenueVsBudget({ year, month, view });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <Link
          href={`/revenue-budgets?year=${year}`}
          className="text-sm text-primary hover:underline"
        >
          Edit the budget
        </Link>
      </div>
      <PeriodFilter
        action="/revenue-vs-budget"
        year={year}
        month={month}
        view={view}
      />
      <RevenueVsBudgetTable rows={rows} view={view} />
    </div>
  );
};

export default RevenueVsBudgetPage;
