import { orderLineStatuses } from "@/lib/enums";
import { ORDER_LINE_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const callOffFilters = (): TableFilterControl[] => [
  { key: "deliveryDate", kind: "dateRange", label: "Delivery date" },
  {
    key: "lineStatus",
    kind: "select",
    label: "Line status",
    placeholder: "Any status",
    options: orderLineStatuses.map((status) => ({
      value: status,
      label: ORDER_LINE_STATUS_LABELS[status],
    })),
  },
];
