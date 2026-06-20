import {
  getWarehousesForSelect,
} from "@/app/(dashboard)/warehouses/actions";
import { getWarehouseSubSectionsForSelect } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddWarehousePage = async () => {
  const [existingWarehouses, subSections] = await Promise.all([
    getWarehousesForSelect(),
    getWarehouseSubSectionsForSelect(),
  ]);

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <PageHeading
        title="Add Warehouse"
        description="Create a new warehouse location"
      />
      <WarehouseForm
        existingWarehouses={existingWarehouses}
        subSections={subSections}
      />
    </div>
  );
};

export default AddWarehousePage;
