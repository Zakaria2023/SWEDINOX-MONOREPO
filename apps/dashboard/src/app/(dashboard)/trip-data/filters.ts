import { TableFilterControl } from "@/lib/table-query";

/** The reference's one filter: `Trip date` from/to. */
export const TRIP_DATA_FILTERS: TableFilterControl[] = [
  { key: "tripDate", kind: "dateRange", label: "Trip date" },
];
