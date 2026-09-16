import { getMachineStockLocationsForSelect } from "@/app/(dashboard)/warehouses/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { MachineForm } from "@/components/machines/machine-form";

const AddMachinePage = async () => {
  const [stockLocations, productGroups, availableProducts] = await Promise.all([
    getMachineStockLocationsForSelect(),
    getProductGroupsForSelect(),
    getProductsForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <MachineForm
        stockLocations={stockLocations}
        productGroups={productGroups}
        availableProducts={availableProducts}
      />
    </div>
  );
};

export default AddMachinePage;
