import { getSigmaNestBlockedOrders } from "@/app/(dashboard)/sigmanest-blocked-orders/actions";
import { SigmaNestBlockedOrdersTable } from "@/components/sigmanest-blocked-orders/sigmanest-blocked-orders-table-content";

const SigmaNestBlockedOrdersPage = async () => {
  const rows = await getSigmaNestBlockedOrders();

  return (
    <div className="space-y-4">
      <SigmaNestBlockedOrdersTable rows={rows} />
    </div>
  );
};

export default SigmaNestBlockedOrdersPage;
