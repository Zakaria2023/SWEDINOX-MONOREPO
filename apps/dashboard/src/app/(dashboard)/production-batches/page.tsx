import { getProductionBatches } from "@/app/(dashboard)/production-batches/actions";
import { PRODUCTION_BATCH_FILTERS } from "@/app/(dashboard)/production-batches/filters";
import { ProductionBatchesTable } from "@/components/production-batches/production-batches-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductionBatchesPage = async ({ searchParams }: Props) => {
  const page = await getProductionBatches(parseTableQuery(await searchParams));

  return (
    <div className="space-y-4">
      <ProductionBatchesTable page={page} filters={PRODUCTION_BATCH_FILTERS} />
    </div>
  );
};

export default ProductionBatchesPage;
