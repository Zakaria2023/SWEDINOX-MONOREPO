import { getAllWarehouseItemsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseSubSectionForm } from "@/components/warehouse-sub-sections/warehouse-sub-section-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddWarehouseSubSectionPage = async () => {
  const allItems = await getAllWarehouseItemsForSelect();

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeading title="Add Warehouse Sub Section" />
      <WarehouseSubSectionForm allItems={allItems} />
    </div>
  );
};

export default AddWarehouseSubSectionPage;
