import { getOrderAdvice } from "@/app/(dashboard)/order-advice/actions";
import { OrderAdviceTable } from "@/components/order-advice/order-advice-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const OrderAdvicePage = async () => {
  const rows = await getOrderAdvice();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Order advice"
        description="Advised purchase quantities per stock product, from stock policy, open orders and invoiced demand"
      />
      <OrderAdviceTable rows={rows} />
    </div>
  );
};

export default OrderAdvicePage;
