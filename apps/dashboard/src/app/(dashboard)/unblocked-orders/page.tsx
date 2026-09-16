import { getUnblockedOrders } from "@/app/(dashboard)/unblocked-orders/actions";
import { UnblockedOrdersTable } from "@/components/unblocked-orders/unblocked-orders-table-content";

const UnblockedOrdersPage = async () => {
  const rows = await getUnblockedOrders();

  return (
    <div className="space-y-4">
      <UnblockedOrdersTable rows={rows} />
    </div>
  );
};

export default UnblockedOrdersPage;
