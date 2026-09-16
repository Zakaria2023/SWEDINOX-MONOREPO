import { getProductionCapacityDetails } from "@/app/(dashboard)/production-capacity-details/actions";
import { ProductionCapacityDetailsTable } from "@/components/production-capacity-details/production-capacity-details-table-content";

const ProductionCapacityDetailsPage = async () => {
  const details = await getProductionCapacityDetails();

  return (
    <div className="space-y-4">
      <ProductionCapacityDetailsTable details={details} />
    </div>
  );
};

export default ProductionCapacityDetailsPage;
