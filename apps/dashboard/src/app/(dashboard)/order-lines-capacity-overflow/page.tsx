import { getOrderLinesCapacityOverflow } from "@/app/(dashboard)/order-lines-capacity-overflow/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { OrderLinesCapacityOverflowTable } from "@/components/order-lines-capacity-overflow/order-lines-capacity-overflow-table-content";

const OrderLinesCapacityOverflowPage = async () => {
  const rows = await getOrderLinesCapacityOverflow();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Order lines capacity overflow" />
      <OrderLinesCapacityOverflowTable rows={rows} />
    </div>
  );
};

export default OrderLinesCapacityOverflowPage;
