import { TableFilterControl } from "@/lib/table-query";

// The reference's only filter on `Production batches`: `Date` from/to, on the
// day the batch was created (`Aangemaakt`).
export const PRODUCTION_BATCH_FILTERS: TableFilterControl[] = [
  { key: "createdOn", kind: "dateRange", label: "Date" },
];
