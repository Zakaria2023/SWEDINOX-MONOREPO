import { TableFilterControl } from "@/lib/table-query";

// The reference's filter box on `Deviations in count lists`: two from/to
// ranges, one on the count's workorder date and one on the day it was reported
// as completed.
export const COUNT_LIST_DEVIATION_FILTERS: TableFilterControl[] = [
  { key: "workOrderDate", kind: "dateRange", label: "Workorder date" },
  {
    key: "reportedAt",
    kind: "dateRange",
    label: "Date reported as completed",
  },
];
