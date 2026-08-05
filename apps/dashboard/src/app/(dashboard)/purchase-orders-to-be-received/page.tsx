import { getPurchaseOrdersToBeReceived } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { PurchaseOrdersToBeReceivedTable } from "@/components/purchase-orders-to-be-received/purchase-orders-to-be-received-table-content";
import { ReceiveGoodsButton } from "@/components/purchase-orders-to-be-received/receive-goods-button";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseOrdersToBeReceivedPage = async () => {
  const rows = await getPurchaseOrdersToBeReceived();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <PageHeading title="Purchase orders to be received" />
        <ReceiveGoodsButton />
      </div>
      <PurchaseOrdersToBeReceivedTable rows={rows} />
    </div>
  );
};

export default PurchaseOrdersToBeReceivedPage;
