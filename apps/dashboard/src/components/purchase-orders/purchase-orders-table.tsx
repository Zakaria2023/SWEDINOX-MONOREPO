import { getPurchaseOrders } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrdersTableContent } from "./purchase-orders-table-content";

export const PurchaseOrdersTable = async () => {
  const purchaseOrders = await getPurchaseOrders();
  return <PurchaseOrdersTableContent purchaseOrders={purchaseOrders} />;
};
