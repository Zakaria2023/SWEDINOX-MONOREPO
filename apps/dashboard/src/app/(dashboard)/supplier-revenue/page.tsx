import { getSupplierRevenue } from "@/app/(dashboard)/supplier-revenue/actions";
import { SupplierRevenueTable } from "@/components/supplier-revenue/supplier-revenue-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const SupplierRevenuePage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getSupplierRevenue({ year: yearNum, month: monthNum });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Supplier revenue"
        description="Purchase turnover and weight per supplier and invoice period"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <SupplierRevenueTable rows={rows} />
    </div>
  );
};

export default SupplierRevenuePage;
