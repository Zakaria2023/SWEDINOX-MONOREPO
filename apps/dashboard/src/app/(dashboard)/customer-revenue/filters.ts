import { salesRepresentatives } from "@/lib/enums";
import { MONTH_LABELS } from "@/lib/labels";
import { SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * The reference reads its period off a `Year` / `Month` pair, and its
 * "this year" columns then hold that one month. Left blank, both fall back to
 * the latest month anything was invoiced in.
 */
export const customerRevenueFilters = (
  years: number[],
): TableFilterControl[] => [
  {
    key: "year",
    kind: "select",
    label: "Year",
    placeholder: "Latest invoiced year",
    options: years.map((year) => ({
      value: String(year),
      label: String(year),
    })),
  },
  {
    key: "month",
    kind: "select",
    label: "Month",
    placeholder: "Latest invoiced month",
    options: MONTH_LABELS.map((label, index) => ({
      value: String(index + 1),
      label,
    })),
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
    key: "active",
    kind: "select",
    label: "Active",
    placeholder: "Active and archived",
    options: [
      { value: "yes", label: "Active" },
      { value: "no", label: "Archived" },
    ],
  },
];
