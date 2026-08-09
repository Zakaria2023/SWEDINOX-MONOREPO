import { ReturnOrderListItem } from "@/app/(dashboard)/return-orders/actions";
import { ReturnOrderReason } from "@/lib/enums";
import { dateCell, ExportColumn, textCell } from "@/lib/excel";
import { RETURN_ORDER_REASON_LABELS } from "@/lib/labels";

/**
 * The return orders overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type ReturnOrderColumnKey =
  | "id"
  | "companyName"
  | "contact"
  | "returnReason"
  | "returnDate"
  | "createdAt";

export const RETURN_ORDER_COLUMNS: Array<
  ExportColumn<ReturnOrderListItem, ReturnOrderColumnKey>
> = [
  { key: "id", label: "#", defaultVisible: true, value: (row) => row.id },
  {
    key: "companyName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "contact",
    label: "Contact",
    defaultVisible: true,
    value: (row) =>
      textCell(
        [row.contactFirstName, row.contactLastName].filter(Boolean).join(" "),
      ),
  },
  {
    key: "returnReason",
    label: "Return Reason",
    defaultVisible: true,
    value: (row) =>
      row.returnReason
        ? (RETURN_ORDER_REASON_LABELS[row.returnReason as ReturnOrderReason] ??
          row.returnReason)
        : null,
  },
  {
    key: "returnDate",
    label: "Return Date",
    defaultVisible: true,
    value: (row) => dateCell(row.returnDate),
  },
  {
    key: "createdAt",
    label: "Created",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
];
