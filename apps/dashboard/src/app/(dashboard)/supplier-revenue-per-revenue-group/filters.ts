import { purchaseSourceTypes } from "@/lib/enums";
import { MONTH_LABELS, ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/** The invoice period, and for the per-group screen the order type. */
export const supplierRevenueFilters = (
  years: number[],
  withOrderType: boolean,
): TableFilterControl[] => [
  {
    key: "year",
    kind: "select",
    label: "Year",
    placeholder: "All years",
    options: years.map((year) => ({
      value: String(year),
      label: String(year),
    })),
  },
  {
    key: "month",
    kind: "select",
    label: "Month",
    placeholder: "All months",
    options: MONTH_LABELS.map((label, index) => ({
      value: String(index + 1),
      label,
    })),
  },
  ...(withOrderType
    ? [
        {
          key: "sourceType",
          kind: "select" as const,
          label: "Order type",
          placeholder: "All order types",
          options: purchaseSourceTypes.map((sourceType) => ({
            value: sourceType,
            label: ORDER_SOURCE_TYPE_LABELS[sourceType],
          })),
        },
      ]
    : []),
];
