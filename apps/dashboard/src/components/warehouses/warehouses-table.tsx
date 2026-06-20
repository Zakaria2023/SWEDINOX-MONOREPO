import { getWarehouses } from "@/app/(dashboard)/warehouses/actions";
import { WarehousesTableContent } from "@/components/warehouses/warehouses-table-content";

export const WarehousesTable = async () => {
  const warehouses = await getWarehouses();

  return <WarehousesTableContent warehouses={warehouses} />;
};
