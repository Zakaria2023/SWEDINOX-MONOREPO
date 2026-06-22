import { getMachineStockLocationsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { MachineForm } from "@/components/machines/machine-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddMachinePage = async () => {
  const stockLocations = await getMachineStockLocationsForSelect();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Machine"
        description="Create a new production machine"
      />
      <MachineForm stockLocations={stockLocations} />
    </div>
  );
};

export default AddMachinePage;
