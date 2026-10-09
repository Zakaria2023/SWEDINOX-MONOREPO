import { LocationOption } from "@/app/(dashboard)/locations/actions";
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
  subsections: LocationOption[] = [],
  locations: LocationOption[] = [],
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
  // The reference's `Sectie` is the warehouse itself, `Subsectie` the level
  // below it, and `Naar` the location a line goes to.
  {
    key: "warehouse",
    kind: "select",
    label: "Section",
    placeholder: "All sections",
    options: warehouses.map((warehouse) => ({
      value: warehouse.uuid,
      label: warehouse.name,
    })),
  },
  {
    key: "subsection",
    kind: "select",
    label: "Subsection",
    placeholder: "All subsections",
    options: subsections.map((subsection) => ({
      value: subsection.uuid,
      label: subsection.name,
    })),
  },
  {
    key: "to",
    kind: "select",
    label: "To",
    placeholder: "Any location",
    options: locations.map((location) => ({
      value: location.uuid,
      label: location.name,
    })),
  },
];
