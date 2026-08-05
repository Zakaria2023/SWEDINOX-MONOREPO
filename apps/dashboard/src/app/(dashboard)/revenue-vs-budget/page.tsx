import { getRevenueVsBudget } from "@/app/(dashboard)/revenue-vs-budget/actions";
import { RevenueVsBudgetTable } from "@/components/revenue-vs-budget/revenue-vs-budget-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const RevenueVsBudgetPage = async () => {
  const rows = await getRevenueVsBudget();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Revenue w.r.t. Budget" />
      <RevenueVsBudgetTable rows={rows} />
    </div>
  );
};

export default RevenueVsBudgetPage;
