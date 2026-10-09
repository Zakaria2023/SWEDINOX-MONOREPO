import { getWarehouseWorkOrderTree } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { warehouseWorkOrderFilters } from "@/app/(dashboard)/warehouse-work-orders/filters";
import { getWarehouseSubSections } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { getWarehousesForSelect } from "@/app/(dashboard)/warehouses/actions";
import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { WarehouseWorkOrdersTable } from "@/components/warehouse-work-orders/warehouse-work-orders-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const WarehouseWorkOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const tree = await getWarehouseWorkOrderTree(query);
  const warehouses = await getWarehousesForSelect();
  const locations = await getLocationsForSelect();
  const users = await getClerkUsersForSelect();
  const subsections = await getWarehouseSubSections();

  return (
    <div className="space-y-4">
      <WarehouseWorkOrdersTable
        tree={tree}
        filters={warehouseWorkOrderFilters(
          warehouses,
          subsections.map(({ uuid, name }) => ({ uuid, name })),
          locations,
        )}
        locations={locations}
        users={users}
      />
    </div>
  );
};

export default WarehouseWorkOrdersPage;
