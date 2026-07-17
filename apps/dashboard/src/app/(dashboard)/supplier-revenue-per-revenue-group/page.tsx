import { getSupplierRevenuePerRevenueGroup } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/actions";
import { SupplierRevenuePerGroupTable } from "@/components/supplier-revenue-per-revenue-group/supplier-revenue-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const SupplierRevenuePerRevenueGroupPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getSupplierRevenuePerRevenueGroup({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Supplier revenue per revenue group"
        description="Purchase turnover, weight and average price per revenue group and invoice period"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <SupplierRevenuePerGroupTable rows={rows} />
    </div>
  );
};

export default SupplierRevenuePerRevenueGroupPage;
