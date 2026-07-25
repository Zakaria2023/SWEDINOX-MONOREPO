import { getSigmaNestBlockedOrders } from "@/app/(dashboard)/sigmanest-blocked-orders/actions";
import { SigmaNestBlockedOrdersTable } from "@/components/sigmanest-blocked-orders/sigmanest-blocked-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SigmaNestBlockedOrdersPage = async () => {
  const rows = await getSigmaNestBlockedOrders();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="SigmaNest Blocked Orders"
        description="Work orders blocked in the SigmaNest nesting-software integration"
      />
      <SigmaNestBlockedOrdersTable rows={rows} />
    </div>
  );
};

export default SigmaNestBlockedOrdersPage;
