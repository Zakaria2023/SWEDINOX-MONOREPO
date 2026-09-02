import { getWarehouseWorkOrders } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { warehouseWorkOrderFilters } from "@/app/(dashboard)/warehouse-work-orders/filters";
import { getWarehousesForSelect } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseWorkOrdersTable } from "@/components/warehouse-work-orders/warehouse-work-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const WarehouseWorkOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const workOrders = await getWarehouseWorkOrders(query);
  const warehouses = await getWarehousesForSelect();

  return (
    <div className="space-y-4">
      <PageHeading title="Warehouse Work Orders" />
      <WarehouseWorkOrdersTable
        page={workOrders}
        filters={warehouseWorkOrderFilters(warehouses)}
      />
    </div>
  );
};

export default WarehouseWorkOrdersPage;
