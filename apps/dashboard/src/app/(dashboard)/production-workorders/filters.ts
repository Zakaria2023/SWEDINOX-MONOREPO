import { MachineOption } from "@/app/(dashboard)/machines/actions";
import { machineOptionTypes, workOrderStatuses } from "@/lib/enums";
import { MACHINE_OPTION_LABELS, WORK_ORDER_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

// The shop narrows this list the way it works: which day, what the machine is
// set up to do, how far along it is, and which machine is doing it.
export const productionWorkOrderFilters = (
  machines: MachineOption[],
): TableFilterControl[] => [
  { key: "plannedDate", kind: "dateRange", label: "Planned date" },
  {
    key: "option",
    kind: "select",
    label: "Option",
    placeholder: "All options",
    options: machineOptionTypes.map((option) => ({
      value: option,
      label: MACHINE_OPTION_LABELS[option],
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
