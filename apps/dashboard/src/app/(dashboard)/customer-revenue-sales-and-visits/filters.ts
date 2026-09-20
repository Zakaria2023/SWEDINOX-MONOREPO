import { salesRepresentatives } from "@/lib/enums";
import { SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const customerRevenueSalesVisitsFilters = (
  revenueGroups: Array<{ value: string; label: string }>,
): TableFilterControl[] => [
  {
    key: "revenueGroup",
    kind: "select",
    label: "Revenue group",
    placeholder: "All groups",
    options: revenueGroups,
  },
  {
    key: "representative",
    kind: "select",
    label: "Representative",
    placeholder: "All representatives",
    options: salesRepresentatives.map((representative) => ({
      value: representative,
      label: SALES_REPRESENTATIVE_LABELS[representative],
    })),
  },
];
