import {
  getWarehousesForSelect,
  getWarehouseLocationsForSelect,
} from "@/app/(dashboard)/warehouses/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";

const AddWarehousePage = async () => {
  const [existingWarehouses, companies, warehouseLocations] = await Promise.all(
    [
      getWarehousesForSelect(),
      getCompaniesForSelect(),
      getWarehouseLocationsForSelect(),
    ],
  );

  return (
    <div className="space-y-4">
      <WarehouseForm
        existingWarehouses={existingWarehouses}
        companies={companies}
        warehouseLocations={warehouseLocations}
      />
    </div>
  );
};

export default AddWarehousePage;
