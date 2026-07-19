import { getOrderLines } from "@/app/(dashboard)/order-lines/actions";
import { OrderLinesTable } from "@/components/order-lines/order-lines-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const OrderLinesPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getOrderLines({ year: yearNum, month: monthNum });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Order lines"
        description="All order lines with pricing, dimensions and margin"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <OrderLinesTable rows={rows} />
    </div>
  );
};

export default OrderLinesPage;
