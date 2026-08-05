import { getOrderLinesStillToBeCalled } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
import { OrderLinesStillToBeCalledTable } from "@/components/order-lines-still-to-be-called/order-lines-still-to-be-called-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const OrderLinesStillToBeCalledPage = async () => {
  const rows = await getOrderLinesStillToBeCalled();

  return (
    <div className="space-y-4">
      <PageHeading title="Order lines still to be called" />
      <OrderLinesStillToBeCalledTable rows={rows} />
    </div>
  );
};

export default OrderLinesStillToBeCalledPage;
