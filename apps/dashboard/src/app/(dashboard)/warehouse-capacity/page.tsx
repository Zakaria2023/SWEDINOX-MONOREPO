import { getWarehouseCapacity } from "@/app/(dashboard)/warehouse-capacity/actions";
import { WarehouseCapacityTable } from "@/components/warehouse-capacity/warehouse-capacity-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const WarehouseCapacityPage = async () => {
  const capacity = await getWarehouseCapacity();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Warehouse Capacity" />
      <WarehouseCapacityTable capacity={capacity} />
    </div>
  );
};

export default WarehouseCapacityPage;
