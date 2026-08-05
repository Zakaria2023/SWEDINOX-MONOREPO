import { getProductionWorkOrderLines } from "@/app/(dashboard)/production-workorders/actions";
import { ProductionWorkOrdersTable } from "@/components/production-workorders/production-workorders-table-content";
import { GenerateProductionButton } from "@/components/production-workorders/generate-production-button";
import { PageHeading } from "@/components/layout/page-heading";

const ProductionWorkOrdersPage = async () => {
  const lines = await getProductionWorkOrderLines();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <PageHeading title="Production workorders" />
        <GenerateProductionButton />
      </div>
      <ProductionWorkOrdersTable lines={lines} />
    </div>
  );
};

export default ProductionWorkOrdersPage;
