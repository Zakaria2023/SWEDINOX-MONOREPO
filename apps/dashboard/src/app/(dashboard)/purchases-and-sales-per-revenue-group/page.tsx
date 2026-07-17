import { getPurchasesAndSalesPerRevenueGroup } from "@/app/(dashboard)/purchases-and-sales-per-revenue-group/actions";
import { PurchasesAndSalesPerRevenueGroupTable } from "@/components/purchases-and-sales-per-revenue-group/purchases-and-sales-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const PurchasesAndSalesPerRevenueGroupPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getPurchasesAndSalesPerRevenueGroup({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchases and sales per revenue group"
        description="Purchased cost and invoiced sales side by side, per revenue group and period"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <PurchasesAndSalesPerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default PurchasesAndSalesPerRevenueGroupPage;
