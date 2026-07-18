import { getMachineStockLocationsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { MachineForm } from "@/components/machines/machine-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddMachinePage = async () => {
  const [stockLocations, productGroups, availableProducts] = await Promise.all([
    getMachineStockLocationsForSelect(),
    getProductGroupsForSelect(),
    getProductsForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Machine"
        description="Create a new production machine"
      />
      <MachineForm
        stockLocations={stockLocations}
        productGroups={productGroups}
        availableProducts={availableProducts}
      />
    </div>
  );
};

export default AddMachinePage;
