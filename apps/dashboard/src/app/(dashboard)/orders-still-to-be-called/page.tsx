import { getOrdersStillToBeCalled } from "@/app/(dashboard)/orders-still-to-be-called/actions";
import { OrdersStillToBeCalledTable } from "@/components/orders-still-to-be-called/orders-still-to-be-called-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const OrdersStillToBeCalledPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getOrdersStillToBeCalled({
    year: yearNum,
    month: monthNum,
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Orders still to be called"
        description="Orders with call-off quantity remaining, with reserved stock on hand"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <OrdersStillToBeCalledTable rows={rows} />
    </div>
  );
};

export default OrdersStillToBeCalledPage;
