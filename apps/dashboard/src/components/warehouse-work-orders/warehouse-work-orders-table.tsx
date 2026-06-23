import { getWarehouseWorkOrders } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { WarehouseWorkOrdersTableContent } from "./warehouse-work-orders-table-content";

export const WarehouseWorkOrdersTable = async () => {
  const workOrders = await getWarehouseWorkOrders();
  return <WarehouseWorkOrdersTableContent workOrders={workOrders} />;
};
