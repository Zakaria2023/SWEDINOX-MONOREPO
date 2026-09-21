import { TableFilterControl } from "@/lib/table-query";

/**
 * The surcharge type first: it decides the revenue group, the unit and whether
 * a weight band applies at all. Only `External transport` uses real bands.
 */
export const chargeFilters = (surcharges: string[]): TableFilterControl[] => [
  {
    key: "surcharge",
    kind: "select",
    label: "Surcharge",
    placeholder: "All surcharges",
    options: surcharges.map((value) => ({ value, label: value })),
  },
  { key: "creationDate", kind: "dateRange", label: "Creation date" },
];
