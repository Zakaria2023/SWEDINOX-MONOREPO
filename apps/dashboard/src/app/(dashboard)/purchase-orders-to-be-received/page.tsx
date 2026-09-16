import { getPurchaseOrdersToBeReceived } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { PurchaseOrdersToBeReceivedTable } from "@/components/purchase-orders-to-be-received/purchase-orders-to-be-received-table-content";
import { ReceiveGoodsButton } from "@/components/purchase-orders-to-be-received/receive-goods-button";

const PurchaseOrdersToBeReceivedPage = async () => {
  const rows = await getPurchaseOrdersToBeReceived();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        <ReceiveGoodsButton />
      </div>
      <PurchaseOrdersToBeReceivedTable rows={rows} />
    </div>
  );
};

export default PurchaseOrdersToBeReceivedPage;
