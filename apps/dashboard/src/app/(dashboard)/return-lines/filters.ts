import { returnOrderReasons } from "@/lib/enums";
import { RETURN_ORDER_REASON_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const returnLineFilters = (): TableFilterControl[] => [
  { key: "createdAt", kind: "dateRange", label: "Creation date" },
  {
    key: "returnReason",
    kind: "select",
    label: "Return reason",
    placeholder: "Any reason",
    options: returnOrderReasons.map((reason) => ({
      value: reason,
      label: RETURN_ORDER_REASON_LABELS[reason],
    })),
  },
];
