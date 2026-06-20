import { getAllWarehouseItemsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseSubSectionForm } from "@/components/warehouse-sub-sections/warehouse-sub-section-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddWarehouseSubSectionPage = async () => {
  const allItems = await getAllWarehouseItemsForSelect();

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <PageHeading
        title="Add Warehouse Sub Section"
        description="Create a new sub section by adapting from an existing warehouse"
      />
      <WarehouseSubSectionForm allItems={allItems} />
    </div>
  );
};

export default AddWarehouseSubSectionPage;
