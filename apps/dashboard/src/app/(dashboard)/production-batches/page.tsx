import { getProductionBatches } from "@/app/(dashboard)/production-batches/actions";
import { ProductionBatchesTable } from "@/components/production-batches/production-batches-table-content";

const ProductionBatchesPage = async () => {
  const batches = await getProductionBatches();

  return (
    <div className="space-y-4">
      <ProductionBatchesTable batches={batches} />
    </div>
  );
};

export default ProductionBatchesPage;
