import { getOrderLinesCapacityOverflow } from "@/app/(dashboard)/order-lines-capacity-overflow/actions";
import { OrderLinesCapacityOverflowTable } from "@/components/order-lines-capacity-overflow/order-lines-capacity-overflow-table-content";

const OrderLinesCapacityOverflowPage = async () => {
  const rows = await getOrderLinesCapacityOverflow();

  return (
    <div className="space-y-4">
      <OrderLinesCapacityOverflowTable rows={rows} />
    </div>
  );
};

export default OrderLinesCapacityOverflowPage;
