import { getOrdersStillToBeCalled } from "@/app/(dashboard)/orders-still-to-be-called/actions";
import { OrdersStillToBeCalledTable } from "@/components/orders-still-to-be-called/orders-still-to-be-called-table-content";

const OrdersStillToBeCalledPage = async () => {
  const rows = await getOrdersStillToBeCalled();

  return (
    <div className="space-y-4">
      <OrdersStillToBeCalledTable rows={rows} />
    </div>
  );
};

export default OrdersStillToBeCalledPage;
