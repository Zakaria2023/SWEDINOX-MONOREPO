import { getCustomerRevenueSplit } from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/actions";
import { CustomerRevenuePerRevenueGroupSplitTable } from "@/components/customer-revenue-per-revenue-group-split/customer-revenue-per-revenue-group-split-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const CustomerRevenueSplitPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getCustomerRevenueSplit({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer revenue per revenue group with split order types"
        description="Sales turnover per customer and revenue group, split by order type"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <CustomerRevenuePerRevenueGroupSplitTable rows={rows} />
    </div>
  );
};

export default CustomerRevenueSplitPage;
