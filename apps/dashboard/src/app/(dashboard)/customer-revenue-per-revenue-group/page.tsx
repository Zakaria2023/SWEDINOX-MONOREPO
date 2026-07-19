import { getCustomerRevenuePerRevenueGroup } from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import { CustomerRevenuePerRevenueGroupTable } from "@/components/customer-revenue-per-revenue-group/customer-revenue-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const CustomerRevenuePerRevenueGroupPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getCustomerRevenuePerRevenueGroup({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer revenue per revenue group"
        description="Sales turnover per customer and revenue group by invoice period"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <CustomerRevenuePerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePerRevenueGroupPage;
