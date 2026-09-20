import { orderSourceTypes, salesRepresentatives } from "@/lib/enums";
import {
  ORDER_SOURCE_TYPE_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const customerRevenuePerRevenueGroupFilters = (
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
  {
    key: "orderType",
    kind: "select",
    label: "Order type",
    placeholder: "All types",
    options: orderSourceTypes.map((type) => ({
      value: type,
      label: ORDER_SOURCE_TYPE_LABELS[type],
    })),
  },
];
