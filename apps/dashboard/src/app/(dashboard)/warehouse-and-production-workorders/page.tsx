import { getWarehouseAndProductionWorkOrders } from "@/app/(dashboard)/warehouse-and-production-workorders/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { WarehouseAndProductionWorkOrdersTable } from "@/components/warehouse-and-production-workorders/warehouse-and-production-workorders-table-content";

const WarehouseAndProductionWorkOrdersPage = async () => {
  const rows = await getWarehouseAndProductionWorkOrders();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Warehouse- and production workorders"
        description="Both workorder streams in one list, with planned against actual weight"
      />
      <WarehouseAndProductionWorkOrdersTable rows={rows} />
    </div>
  );
};

export default WarehouseAndProductionWorkOrdersPage;
