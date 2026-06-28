import { getOrders } from "@/app/(dashboard)/orders/actions";
import { OrdersTableContent } from "./orders-table-content";

export const OrdersTable = async () => {
  const orders = await getOrders();
  return <OrdersTableContent orders={orders} />;
};
