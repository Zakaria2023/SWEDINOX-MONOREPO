import { OrderListItem } from "@/app/(dashboard)/orders/actions";
import { OrderMethod } from "@/lib/enums";
import { dateCell, ExportColumn, textCell } from "@/lib/excel";
import { ORDER_METHOD_LABELS, ORDER_TYPE_LABELS } from "@/lib/labels";

/**
 * The orders overview as a sheet: the columns it shows, and the plain value
 * behind each cell.
 *
 * A plain module rather than part of the table, because the export action reads
 * it on the server and a client component cannot be read from there — see
 * app/(dashboard)/addresses/columns.ts for the same arrangement.
 */

export type OrderColumnKey =
  | "id"
  | "companyName"
  | "contact"
  | "orderType"
  | "orderMethod"
  | "deliveryDate"
  | "createdAt";

export const ORDER_COLUMNS: Array<ExportColumn<OrderListItem, OrderColumnKey>> =
  [
    { key: "id", label: "#", defaultVisible: true, value: (row) => row.id },
    {
      key: "companyName",
      label: "Company",
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
      key: "orderType",
      label: "Order type",
      // Hidden by default: 1.933 of the reference's 1.970 lines are Normal, so
      // the column is nearly all one value and only earns its width when
      // somebody is looking for the call-offs and the rushes.
      defaultVisible: false,
      value: (row) => ORDER_TYPE_LABELS[row.orderType],
    },
    {
      key: "orderMethod",
      label: "Method",
      defaultVisible: true,
      value: (row) =>
        row.orderMethod
          ? (ORDER_METHOD_LABELS[row.orderMethod as OrderMethod] ??
            row.orderMethod)
          : null,
    },
    {
      key: "deliveryDate",
      label: "Delivery Date",
      defaultVisible: true,
      // The screen falls back to the delivery week when no day is fixed, and so
      // does the file — otherwise an order that is scheduled looks unscheduled.
      value: (row) =>
        row.deliveryDate
          ? dateCell(row.deliveryDate)
          : row.deliveryWeek && row.deliveryYear
            ? `W${row.deliveryWeek} ${row.deliveryYear}`
            : null,
    },
    {
      key: "createdAt",
      label: "Created",
      defaultVisible: true,
      value: (row) => dateCell(row.createdAt),
    },
  ];
