import { getOrderLinesStillToBeCalled } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
import { OrderLinesStillToBeCalledTable } from "@/components/order-lines-still-to-be-called/order-lines-still-to-be-called-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const OrderLinesStillToBeCalledPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getOrderLinesStillToBeCalled({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Order lines still to be called"
        description="Order lines with call-off quantity remaining"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <OrderLinesStillToBeCalledTable rows={rows} />
    </div>
  );
};

export default OrderLinesStillToBeCalledPage;
