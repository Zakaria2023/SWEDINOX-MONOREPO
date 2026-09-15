import { TableFilterControl } from "@/lib/table-query";

export const PURCHASE_INVOICE_LINE_FILTERS: TableFilterControl[] = [
  { key: "bookingDate", kind: "dateRange", label: "Booking date" },
];
