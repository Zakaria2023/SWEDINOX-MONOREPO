import { getUnblockedOrders } from "@/app/(dashboard)/unblocked-orders/actions";
import { UnblockedOrdersTable } from "@/components/unblocked-orders/unblocked-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const UnblockedOrdersPage = async () => {
  const rows = await getUnblockedOrders();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Unblocked orders"
        description="Orders whose block has been released, from the deblock audit trail"
      />
      <UnblockedOrdersTable rows={rows} />
    </div>
  );
};

export default UnblockedOrdersPage;
