import { getAllWarehouseItemsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseSubSectionForm } from "@/components/warehouse-sub-sections/warehouse-sub-section-form";

const AddWarehouseSubSectionPage = async () => {
  const allItems = await getAllWarehouseItemsForSelect();

  return (
    <div className="space-y-4">
      <WarehouseSubSectionForm allItems={allItems} />
    </div>
  );
};

export default AddWarehouseSubSectionPage;
