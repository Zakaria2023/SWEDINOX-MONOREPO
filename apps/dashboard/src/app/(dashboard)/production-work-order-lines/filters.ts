import { MachineOption } from "@/app/(dashboard)/machines/actions";
import { workOrderStatuses } from "@/lib/enums";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const productionWorkOrderLineFilters = (
  machines: MachineOption[],
): TableFilterControl[] => [
  { key: "workOrderDate", kind: "dateRange", label: "Workorder date" },
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
    key: "machine",
    kind: "select",
    label: "Machine",
    placeholder: "All machines",
    options: machines.map((machine) => ({
      value: machine.uuid,
      label: machine.name,
    })),
  },
];
