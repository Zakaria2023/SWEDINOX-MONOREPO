import { getCustomerRevenue } from "@/app/(dashboard)/customer-revenue/actions";
import { CustomerRevenueTable } from "@/components/customer-revenue/customer-revenue-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const CustomerRevenuePage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getCustomerRevenue({ year: yearNum, month: monthNum });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer revenue"
        description="Sales turnover and weight per customer and invoice period"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <CustomerRevenueTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePage;
