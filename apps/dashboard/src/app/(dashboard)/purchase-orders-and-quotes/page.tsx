import { getPurchaseOrdersAndQuotes } from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import { PurchaseOrdersAndQuotesTable } from "@/components/purchase-orders-and-quotes/purchase-orders-and-quotes-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const PurchaseOrdersAndQuotesPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getPurchaseOrdersAndQuotes({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchase orders and quotes"
        description="Purchase orders and quotes combined, by creation date"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <PurchaseOrdersAndQuotesTable rows={rows} />
    </div>
  );
};

export default PurchaseOrdersAndQuotesPage;
