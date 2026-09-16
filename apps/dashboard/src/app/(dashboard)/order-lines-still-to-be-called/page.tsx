import { getOrderLinesStillToBeCalled } from "@/app/(dashboard)/order-lines-still-to-be-called/actions";
import { OrderLinesStillToBeCalledTable } from "@/components/order-lines-still-to-be-called/order-lines-still-to-be-called-table-content";

const OrderLinesStillToBeCalledPage = async () => {
  const rows = await getOrderLinesStillToBeCalled();

  return (
    <div className="space-y-4">
      <OrderLinesStillToBeCalledTable rows={rows} />
    </div>
  );
};

export default OrderLinesStillToBeCalledPage;
