import { Suspense } from "react";
import { WarehouseWorkOrdersTable } from "@/components/warehouse-work-orders/warehouse-work-orders-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const WarehouseWorkOrdersPage = () => (
  <div className="space-y-6 p-6">
    <PageHeading
      title="Warehouse Work Orders"
      description="Work orders generated per warehouse"
    />
    <Suspense fallback={<DataTableFallback columnCount={4} />}>
      <WarehouseWorkOrdersTable />
    </Suspense>
  </div>
);

export default WarehouseWorkOrdersPage;
