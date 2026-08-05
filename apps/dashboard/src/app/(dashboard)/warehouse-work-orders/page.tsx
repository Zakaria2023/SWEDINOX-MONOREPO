import { getWarehouseWorkOrders } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { WarehouseWorkOrdersTable } from "@/components/warehouse-work-orders/warehouse-work-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const WarehouseWorkOrdersPage = async () => {
  const workOrders = await getWarehouseWorkOrders();

  return (
    <div className="space-y-4">
      <PageHeading title="Warehouse Work Orders" />
      <WarehouseWorkOrdersTable workOrders={workOrders} />
    </div>
  );
};

export default WarehouseWorkOrdersPage;
