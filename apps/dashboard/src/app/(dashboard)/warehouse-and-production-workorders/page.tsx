import { getWarehouseAndProductionWorkOrders } from "@/app/(dashboard)/warehouse-and-production-workorders/actions";
import { WarehouseAndProductionWorkOrdersTable } from "@/components/warehouse-and-production-workorders/warehouse-and-production-workorders-table-content";

const WarehouseAndProductionWorkOrdersPage = async () => {
  const rows = await getWarehouseAndProductionWorkOrders();

  return (
    <div className="space-y-4">
      <WarehouseAndProductionWorkOrdersTable rows={rows} />
    </div>
  );
};

export default WarehouseAndProductionWorkOrdersPage;
