import { getRevenuePerRevenueGroup } from "@/app/(dashboard)/revenue-per-revenue-group/actions";
import { RevenuePerRevenueGroupTable } from "@/components/revenue-per-revenue-group/revenue-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const RevenuePerRevenueGroupPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getRevenuePerRevenueGroup({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Revenue per revenue group"
        description="Invoiced sales, profit and margin rolled up per revenue group"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <RevenuePerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default RevenuePerRevenueGroupPage;
