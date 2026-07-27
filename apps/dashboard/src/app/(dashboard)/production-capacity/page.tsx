import { getProductionCapacity } from "@/app/(dashboard)/production-capacity/actions";
import { ProductionCapacityTable } from "@/components/production-capacity/production-capacity-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ProductionCapacityPage = async () => {
  const capacity = await getProductionCapacity();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Production Capacity"
        description="Machine capacity per day — occupied, ready and remaining (square and not-square) against each machine's limits"
      />
      <ProductionCapacityTable capacity={capacity} />
    </div>
  );
};

export default ProductionCapacityPage;
