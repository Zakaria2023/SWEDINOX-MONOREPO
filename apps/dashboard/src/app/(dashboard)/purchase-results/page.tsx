import { getPurchaseResults } from "@/app/(dashboard)/purchase-results/actions";
import { PurchaseResultsTable } from "@/components/purchase-results/purchase-results-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const PurchaseResultsPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getPurchaseResults({ year: yearNum, month: monthNum });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchase results"
        description="What was paid for received goods against today's replacement value"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <PurchaseResultsTable rows={rows} />
    </div>
  );
};

export default PurchaseResultsPage;
