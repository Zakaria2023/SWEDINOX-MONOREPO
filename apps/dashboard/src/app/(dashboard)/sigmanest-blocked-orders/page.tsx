import { getSigmaNestBlockedOrders } from "@/app/(dashboard)/sigmanest-blocked-orders/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { SigmaNestBlockedOrdersTable } from "@/components/sigmanest-blocked-orders/sigmanest-blocked-orders-table-content";

const SigmaNestBlockedOrdersPage = async () => {
  const rows = await getSigmaNestBlockedOrders();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="SigmaNest blocked orders" />
      <SigmaNestBlockedOrdersTable rows={rows} />
    </div>
  );
};

export default SigmaNestBlockedOrdersPage;
