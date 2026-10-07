import { getWarehouseAndProductionWorkOrders } from "@/app/(dashboard)/warehouse-and-production-workorders/actions";
import { WarehouseAndProductionWorkOrdersTable } from "@/components/warehouse-and-production-workorders/warehouse-and-production-workorders-table-content";
import {
  parseTableQuery,
  SearchParams,
  TableFilterControl,
} from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const FILTERS: TableFilterControl[] = [
  { key: "workOrderDate", kind: "dateRange", label: "Workorder date" },
  {
    key: "kind",
    kind: "select",
    label: "Stream",
    placeholder: "Warehouse and production",
    options: [
      { value: "warehouse", label: "Warehouse" },
      { value: "production", label: "Production" },
    ],
  },
];

const WarehouseAndProductionWorkOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getWarehouseAndProductionWorkOrders(query);

  return (
    <div className="space-y-4">
      <WarehouseAndProductionWorkOrdersTable page={page} filters={FILTERS} />
    </div>
  );
};

export default WarehouseAndProductionWorkOrdersPage;
