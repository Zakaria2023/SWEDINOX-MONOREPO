import { WarehouseOption } from "@/app/(dashboard)/warehouses/actions";
import { warehouseWorkOrderTypes, workOrderStatuses } from "@/lib/enums";
import {
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

// The reference's own filter block is `Product code` and `Workorder date`;
// the search box covers the first, and type, status and section narrow the
// rest the way the floor reads the list.
export const warehouseWorkOrderLineFilters = (
  warehouses: WarehouseOption[],
): TableFilterControl[] => [
  { key: "workOrderDate", kind: "dateRange", label: "Workorder date" },
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
    key: "section",
    kind: "select",
    label: "Section",
    placeholder: "All sections",
    options: warehouses.map((warehouse) => ({
      value: warehouse.uuid,
      label: warehouse.name,
    })),
  },
];
