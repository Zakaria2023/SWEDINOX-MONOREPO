import { getWarehousesForSelect } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddWarehousePage = async () => {
  const existingWarehouses = await getWarehousesForSelect();

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <PageHeading
        title="Add Warehouse"
        description="Create a new warehouse location"
      />
      <WarehouseForm existingWarehouses={existingWarehouses} />
    </div>
  );
};

export default AddWarehousePage;
