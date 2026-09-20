import { orderSourceTypes, orderTypes } from "@/lib/enums";
import { ORDER_SOURCE_TYPE_LABELS, ORDER_TYPE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * Both order axes are offered, because this screen exists to tell them apart:
 * call-off and rush only ever occur on stock lines in the reference, never on
 * a direct delivery.
 */
export const customerRevenueSplitFilters = (
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
    key: "orderType",
    kind: "select",
    label: "Order type",
    placeholder: "All order types",
    options: orderTypes.map((type) => ({
      value: type,
      label: ORDER_TYPE_LABELS[type],
    })),
  },
  {
    key: "sourceType",
    kind: "select",
    label: "Supply",
    placeholder: "Stock and direct",
    options: orderSourceTypes.map((type) => ({
      value: type,
      label: ORDER_SOURCE_TYPE_LABELS[type],
    })),
  },
];
