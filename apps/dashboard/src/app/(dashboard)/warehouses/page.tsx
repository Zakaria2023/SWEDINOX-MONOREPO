import { getWarehouses } from "@/app/(dashboard)/warehouses/actions";
import { WarehousesTable } from "@/components/warehouses/warehouses-table-content";

const WarehousesPage = async () => {
  const warehouses = await getWarehouses();

  return <WarehousesTable warehouses={warehouses} />;
};

export default WarehousesPage;
