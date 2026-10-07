import { getWarehouseWorkOrderLineOverview } from "@/app/(dashboard)/warehouse-work-order-lines/actions";
import { warehouseWorkOrderLineFilters } from "@/app/(dashboard)/warehouse-work-order-lines/filters";
import { getWarehousesForSelect } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseWorkOrderLinesTable } from "@/components/warehouse-work-order-lines/warehouse-work-order-lines-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const WarehouseWorkOrderLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getWarehouseWorkOrderLineOverview(query);
  const warehouses = await getWarehousesForSelect();

  return (
    <div className="space-y-4">
      <WarehouseWorkOrderLinesTable
        page={page}
        filters={warehouseWorkOrderLineFilters(warehouses)}
      />
    </div>
  );
};

export default WarehouseWorkOrderLinesPage;
