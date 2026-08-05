import { getOrderLines } from "@/app/(dashboard)/order-lines/actions";
import { OrderLinesTable } from "@/components/order-lines/order-lines-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const OrderLinesPage = async () => {
  const rows = await getOrderLines();

  return (
    <div className="space-y-4">
      <PageHeading title="Order lines" />
      <OrderLinesTable rows={rows} />
    </div>
  );
};

export default OrderLinesPage;
