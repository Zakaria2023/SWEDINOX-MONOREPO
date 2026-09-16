import { getProductionWorkOrderTree } from "@/app/(dashboard)/production-workorders/actions";
import { productionWorkOrderFilters } from "@/app/(dashboard)/production-workorders/filters";
import { getMachinesForSelect } from "@/app/(dashboard)/machines/actions";
import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
// The lots a run can be fed from are the same lots the warehouse picks from,
// so the lookup is reused rather than written twice.
import { getAvailableStockForSelect } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { ProductionWorkOrdersTable } from "@/components/production-workorders/production-workorders-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductionWorkOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const tree = await getProductionWorkOrderTree(query);
  const machines = await getMachinesForSelect();
  const stockOptions = await getAvailableStockForSelect();
  const locations = await getLocationsForSelect();

  return (
    <div className="space-y-4">
      <ProductionWorkOrdersTable
        tree={tree}
        filters={productionWorkOrderFilters(machines)}
        stockOptions={stockOptions}
        locations={locations}
      />
    </div>
  );
};

export default ProductionWorkOrdersPage;
