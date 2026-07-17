import { getProductionBatches } from "@/app/(dashboard)/production-batches/actions";
import { ProductionBatchesTable } from "@/components/production-batches/production-batches-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ProductionBatchesPage = async () => {
  const batches = await getProductionBatches();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Production batches"
        description="Batches produced on a machine, destined for a stock location"
      />
      <ProductionBatchesTable batches={batches} />
    </div>
  );
};

export default ProductionBatchesPage;
