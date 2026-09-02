import { WarehouseOption } from "@/app/(dashboard)/warehouses/actions";
import { workOrderStatuses, warehouseWorkOrderTypes } from "@/lib/enums";
import {
  WORK_ORDER_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

// The floor narrows this list the way it works: which day, what kind of job,
// how far along it is, and which warehouse it belongs to.
export const warehouseWorkOrderFilters = (
  warehouses: WarehouseOption[],
): TableFilterControl[] => [
  { key: "plannedDate", kind: "dateRange", label: "Planned date" },
  {
    key: "type",
    kind: "select",
    label: "Type",
    placeholder: "All types",
    options: warehouseWorkOrderTypes.map((type) => ({
      value: type,
      label: WAREHOUSE_WORK_ORDER_TYPE_LABELS[type],
    })),
  },
  {
    key: "status",
    kind: "select",
    label: "Status",
    placeholder: "Any status",
    options: workOrderStatuses.map((status) => ({
      value: status,
      label: WORK_ORDER_STATUS_LABELS[status],
    })),
  },
  {
    key: "warehouse",
    kind: "select",
    label: "Warehouse",
    placeholder: "All warehouses",
    options: warehouses.map((warehouse) => ({
      value: warehouse.uuid,
      label: warehouse.name,
    })),
  },
];
