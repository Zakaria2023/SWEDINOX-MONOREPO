import {
  getWarehousesForSelect,
  getWarehouseLocationsForSelect,
} from "@/app/(dashboard)/warehouses/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddWarehousePage = async () => {
  const [existingWarehouses, companies, warehouseLocations] = await Promise.all(
    [
      getWarehousesForSelect(),
      getCompaniesForSelect(),
      getWarehouseLocationsForSelect(),
    ],
  );

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading title="Add Warehouse" />
      <WarehouseForm
        existingWarehouses={existingWarehouses}
        companies={companies}
        warehouseLocations={warehouseLocations}
      />
    </div>
  );
};

export default AddWarehousePage;
