import { getAllWarehouseItemsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { LocationForm } from "@/components/locations/location-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddLocationPage = async () => {
  const allItems = await getAllWarehouseItemsForSelect();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Location"
        description="Create a new location by adapting from an existing warehouse"
      />
      <LocationForm allItems={allItems} />
    </div>
  );
};

export default AddLocationPage;
