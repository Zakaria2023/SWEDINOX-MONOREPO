import { getCustomerRevenuePerProductGroup } from "@/app/(dashboard)/customer-revenue-per-product-group/actions";
import { CustomerRevenuePerProductGroupTable } from "@/components/customer-revenue-per-product-group/customer-revenue-per-product-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const CustomerRevenuePerProductGroupPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getCustomerRevenuePerProductGroup({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer revenue per product group"
        description="Sales turnover per customer and product group by invoice period"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <CustomerRevenuePerProductGroupTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePerProductGroupPage;
