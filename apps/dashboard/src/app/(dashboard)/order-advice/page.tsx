import { getOrderAdvice } from "@/app/(dashboard)/order-advice/actions";
import { OrderAdviceTable } from "@/components/order-advice/order-advice-table-content";

const OrderAdvicePage = async () => {
  const rows = await getOrderAdvice();

  return (
    <div className="space-y-4">
      <OrderAdviceTable rows={rows} />
    </div>
  );
};

export default OrderAdvicePage;
