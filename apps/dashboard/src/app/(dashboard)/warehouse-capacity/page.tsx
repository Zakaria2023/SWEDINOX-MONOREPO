import { getWarehouseCapacity } from "@/app/(dashboard)/warehouse-capacity/actions";
import { WarehouseCapacityTable } from "@/components/warehouse-capacity/warehouse-capacity-table-content";

const WarehouseCapacityPage = async () => {
  const capacity = await getWarehouseCapacity();

  return (
    <div className="space-y-4">
      <WarehouseCapacityTable capacity={capacity} />
    </div>
  );
};

export default WarehouseCapacityPage;
