import { CounterOrderListItem } from "@/app/(dashboard)/counter-orders/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { daysInSystem } from "@/lib/helpers";
import {
  COUNTER_ORDER_PRIORITY_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
} from "@/lib/labels";

/**
 * The counter orders overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type CounterOrderColumnKey =
  | "id"
  | "companyName"
  | "handlingBlocked"
  | "status"
  | "orderDate"
  | "deliveryDate"
  | "amountExVat"
  | "weightKg"
  | "customerRef"
  | "gainPercent"
  | "daysInSystem"
  | "priority"
  | "createdAt";

export const COUNTER_ORDER_COLUMNS: Array<
  ExportColumn<CounterOrderListItem, CounterOrderColumnKey>
> = [
  {
    key: "id",
    label: "Order no",
    defaultVisible: true,
    value: (row) => row.id,
  },
  {
    key: "companyName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "handlingBlocked",
    label: "Blocked",
    defaultVisible: true,
    value: (row) => yesNoCell(row.handlingBlocked),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) =>
      row.status ? COUNTER_ORDER_STATUS_LABELS[row.status] : null,
  },
  {
    key: "orderDate",
    label: "Order date",
    defaultVisible: true,
    value: (row) => dateCell(row.orderDate),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "amountExVat",
    label: "Amount (ex VAT)",
    defaultVisible: true,
    value: (row) => numberCell(row.amountExVat),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "customerRef",
    label: "Customer reference",
    defaultVisible: true,
    value: (row) => textCell(row.customerRef),
  },
  {
    key: "gainPercent",
    label: "Gain%",
    defaultVisible: true,
    value: (row) => numberCell(row.gainPercent),
  },
  {
    key: "daysInSystem",
    label: "Days in system",
    defaultVisible: true,
    value: (row) => daysInSystem(row.createdAt),
  },
  {
    key: "priority",
    label: "Priority",
    defaultVisible: false,
    value: (row) =>
      row.priority ? COUNTER_ORDER_PRIORITY_LABELS[row.priority] : null,
  },
  {
    key: "createdAt",
    label: "Created At",
    defaultVisible: false,
    value: (row) => dateCell(row.createdAt),
  },
];
