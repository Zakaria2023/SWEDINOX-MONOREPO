import { getProductionCapacity } from "@/app/(dashboard)/production-capacity/actions";
import { ProductionCapacityTable } from "@/components/production-capacity/production-capacity-table-content";

const ProductionCapacityPage = async () => {
  const capacity = await getProductionCapacity();

  return (
    <div className="space-y-4">
      <ProductionCapacityTable capacity={capacity} />
    </div>
  );
};

export default ProductionCapacityPage;
