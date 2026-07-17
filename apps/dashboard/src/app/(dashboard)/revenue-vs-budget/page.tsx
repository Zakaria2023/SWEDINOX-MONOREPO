import { getRevenueVsBudget } from "@/app/(dashboard)/revenue-vs-budget/actions";
import { RevenueVsBudgetTable } from "@/components/revenue-vs-budget/revenue-vs-budget-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const RevenueVsBudgetPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getRevenueVsBudget({ year: yearNum, month: monthNum });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Revenue w.r.t. Budget"
        description="Actual invoiced sales against the budget, per revenue group"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <RevenueVsBudgetTable rows={rows} />
    </div>
  );
};

export default RevenueVsBudgetPage;
