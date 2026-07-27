import { getProductionCapacityDetails } from "@/app/(dashboard)/production-capacity-details/actions";
import { ProductionCapacityDetailsTable } from "@/components/production-capacity-details/production-capacity-details-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ProductionCapacityDetailsPage = async () => {
  const details = await getProductionCapacityDetails();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Production Capacity Details"
        description="The per-order-line production and sawing drill-down: dimensions, quantities, delivery and the full sawing plan"
      />
      <ProductionCapacityDetailsTable details={details} />
    </div>
  );
};

export default ProductionCapacityDetailsPage;
