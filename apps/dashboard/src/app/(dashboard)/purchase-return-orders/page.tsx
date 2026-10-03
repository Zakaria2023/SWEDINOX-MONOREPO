import { getPurchaseReturnOrders } from "@/app/(dashboard)/purchase-return-orders/actions";
import { PurchaseReturnOrdersTable } from "@/components/purchase-return-orders/purchase-return-orders-table-content";

const PurchaseReturnOrdersPage = async () => {
  const purchaseReturnOrders = await getPurchaseReturnOrders();

  return (
    <PurchaseReturnOrdersTable purchaseReturnOrders={purchaseReturnOrders} />
  );
};

export default PurchaseReturnOrdersPage;
