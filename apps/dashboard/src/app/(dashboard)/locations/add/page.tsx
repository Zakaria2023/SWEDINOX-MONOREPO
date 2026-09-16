import { getAllWarehouseItemsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { LocationForm } from "@/components/locations/location-form";

const AddLocationPage = async () => {
  const allItems = await getAllWarehouseItemsForSelect();

  return (
    <div className="space-y-4">
      <LocationForm allItems={allItems} />
    </div>
  );
};

export default AddLocationPage;
