import {
  getRevenueBudgets,
  getRevenueGroupOptions,
} from "@/app/(dashboard)/revenue-budgets/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { RevenueBudgetForm } from "@/components/revenue-budgets/revenue-budget-form";
import { RevenueBudgetsTable } from "@/components/revenue-budgets/revenue-budgets-table";
import { PeriodFilter } from "@/components/revenue-vs-budget/period-filter";
import { parseYearParam } from "@/lib/helpers";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

const RevenueBudgetsPage = async ({ searchParams }: Props) => {
  const { year: yearParam } = await searchParams;
  const year = parseYearParam(yearParam);

  const [budgets, revenueGroups] = await Promise.all([
    getRevenueBudgets(year),
    getRevenueGroupOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeading title="Revenue budgets" />
        <Link
          href={`/revenue-vs-budget?year=${year}`}
          className="text-sm text-primary hover:underline"
        >
          Revenue w.r.t. Budget
        </Link>
      </div>
      <PeriodFilter
        action="/revenue-budgets"
        year={year}
        month={null}
        showMonth={false}
      />
      <RevenueBudgetForm year={year} revenueGroups={revenueGroups} />
      <RevenueBudgetsTable rows={budgets} />
    </div>
  );
};

export default RevenueBudgetsPage;
