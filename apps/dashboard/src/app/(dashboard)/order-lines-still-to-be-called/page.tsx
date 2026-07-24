import { getOrderLinesStillToBeCalled } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
import { OrderLinesStillToBeCalledTable } from "@/components/order-lines-still-to-be-called/order-lines-still-to-be-called-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const OrderLinesStillToBeCalledPage = async () => {
  const rows = await getOrderLinesStillToBeCalled();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Order lines still to be called"
        description="Order lines with call-off quantity remaining"
      />
      <OrderLinesStillToBeCalledTable rows={rows} />
    </div>
  );
};

export default OrderLinesStillToBeCalledPage;
