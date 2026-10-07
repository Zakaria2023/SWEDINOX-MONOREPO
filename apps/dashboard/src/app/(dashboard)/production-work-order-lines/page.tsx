import { getMachinesForSelect } from "@/app/(dashboard)/machines/actions";
import { getProductionWorkOrderLineOverview } from "@/app/(dashboard)/production-work-order-lines/actions";
import { productionWorkOrderLineFilters } from "@/app/(dashboard)/production-work-order-lines/filters";
import { ProductionWorkOrderLinesTable } from "@/components/production-work-order-lines/production-work-order-lines-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductionWorkOrderLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getProductionWorkOrderLineOverview(query);
  const machines = await getMachinesForSelect();

  return (
    <div className="space-y-4">
      <ProductionWorkOrderLinesTable
        page={page}
        filters={productionWorkOrderLineFilters(machines)}
      />
    </div>
  );
};

export default ProductionWorkOrderLinesPage;
