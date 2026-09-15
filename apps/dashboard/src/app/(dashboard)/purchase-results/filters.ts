import { TableFilterControl } from "@/lib/table-query";

export const PURCHASE_RESULT_FILTERS: TableFilterControl[] = [
  { key: "receiptDate", kind: "dateRange", label: "Receipt date" },
];
