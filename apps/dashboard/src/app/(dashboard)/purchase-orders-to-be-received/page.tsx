import { getPurchaseOrdersToBeReceived } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { PurchaseOrdersToBeReceivedTable } from "@/components/purchase-orders-to-be-received/purchase-orders-to-be-received-table-content";

const PurchaseOrdersToBeReceivedPage = async () => {
  const rows = await getPurchaseOrdersToBeReceived();

  return <PurchaseOrdersToBeReceivedTable rows={rows} />;
};

export default PurchaseOrdersToBeReceivedPage;
