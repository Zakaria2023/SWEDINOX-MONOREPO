import { getOrderAdvice } from "@/app/(dashboard)/order-advice/actions";
import { OrderAdviceTable } from "@/components/order-advice/order-advice-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const OrderAdvicePage = async () => {
  const rows = await getOrderAdvice();

  return (
    <div className="space-y-4">
      <PageHeading title="Order advice" />
      <OrderAdviceTable rows={rows} />
    </div>
  );
};

export default OrderAdvicePage;
