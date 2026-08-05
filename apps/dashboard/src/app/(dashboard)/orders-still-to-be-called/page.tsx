import { getOrdersStillToBeCalled } from "@/app/(dashboard)/orders-still-to-be-called/actions";
import { OrdersStillToBeCalledTable } from "@/components/orders-still-to-be-called/orders-still-to-be-called-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const OrdersStillToBeCalledPage = async () => {
  const rows = await getOrdersStillToBeCalled();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Orders still to be called" />
      <OrdersStillToBeCalledTable rows={rows} />
    </div>
  );
};

export default OrdersStillToBeCalledPage;
