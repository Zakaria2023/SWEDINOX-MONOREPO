import { getRevenuePerProduct } from "@/app/(dashboard)/revenue-per-product/actions";
import { RevenuePerProductTable } from "@/components/revenue-per-product/revenue-per-product-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const RevenuePerProductPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getRevenuePerProduct({ year: yearNum, month: monthNum });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Revenue per product"
        description="Invoiced sales, profit and margin per product and period"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <RevenuePerProductTable rows={rows} />
    </div>
  );
};

export default RevenuePerProductPage;
