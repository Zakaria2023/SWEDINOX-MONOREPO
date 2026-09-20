import { customerGroups, salesRepresentatives } from "@/lib/enums";
import {
  CUSTOMER_GROUP_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * The reference has one filter, the reference date, and stamps it back onto
 * every row. That one is kept and named the way the screen names it; the rest
 * are the attributes the grid already groups by.
 */
export const customerOverviewFilters = (
  regions: string[],
): TableFilterControl[] => [
  { key: "referenceDate", kind: "dateRange", label: "Reference date" },
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
    key: "customerGroup",
    kind: "select",
    label: "Customer group",
    placeholder: "All groups",
    options: customerGroups.map((group) => ({
      value: group,
      label: CUSTOMER_GROUP_LABELS[group],
    })),
  },
  {
    key: "region",
    kind: "select",
    label: "Region",
    placeholder: "All regions",
    options: regions.map((region) => ({ value: region, label: region })),
  },
];
