import { MONTH_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/** The trip date's year and month, the reference's own two period columns. */
export const tripDataFilters = (years: number[]): TableFilterControl[] => [
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
];
