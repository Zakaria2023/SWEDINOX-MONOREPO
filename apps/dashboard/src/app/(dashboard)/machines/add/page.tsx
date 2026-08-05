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
    <div className="space-y-4">
      <PageHeading title="Add Machine" />
      <MachineForm
        stockLocations={stockLocations}
        productGroups={productGroups}
        availableProducts={availableProducts}
      />
    </div>
  );
};

export default AddMachinePage;
