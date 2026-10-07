import { UnblockedOrderRow } from "@/app/(dashboard)/unblocked-orders/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  timeCell,
} from "@/lib/excel";
import { monthLabel, orderDeblockTypeLabel } from "@/lib/helpers";

/**
 * Unblocked orders as a sheet — one row per release event, in the reference's
 * column order.
 *
 * `Region number` is `0` on all 571 of the reference's rows, the fourth screen
 * to show it dead. It prints blank and is hidden by default.
 *
 * `Deblock date` and `Deblock time` are one timestamp in the reference too —
 * the same serial printed twice — but the hour is the interesting half here,
 * since a financial release lands within the hour and a commercial one takes
 * days. Both are kept.
 */

export type UnblockedOrderColumnKey =
  | "customerName"
  | "city"
  | "debtorNumber"
  | "deblockType"
  | "year"
  | "month"
  | "deblockDate"
  | "deblockTime"
  | "deblockedBy"
  | "order"
  | "orderCreatedAt"
  | "orderAmount"
  | "region"
  | "regionNumber";

export const UNBLOCKED_ORDER_COLUMNS: Array<
  ExportColumn<UnblockedOrderRow, UnblockedOrderColumnKey>
> = [
  {
    key: "customerName",
    label: "Customer name",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "debtorNumber",
    label: "Debtor number",
    defaultVisible: true,
    value: (row) => textCell(row.debtorNumber),
  },
  {
    key: "deblockType",
    label: "Deblock type",
    defaultVisible: true,
    value: (row) => textCell(orderDeblockTypeLabel(row.deblockType)),
  },
  {
    key: "year",
    label: "Year (Deblock date)",
    defaultVisible: true,
    value: (row) => numberCell(row.year),
  },
  {
    key: "month",
    label: "Month (Deblock date)",
    defaultVisible: true,
    value: (row) => textCell(row.month ? monthLabel(row.month) : null),
  },
  {
    key: "deblockDate",
    label: "Deblock date",
    defaultVisible: true,
    value: (row) => dateCell(row.deblockDate),
  },
  {
    key: "deblockTime",
    label: "Deblock time",
    defaultVisible: true,
    value: (row) => timeCell(row.deblockDate),
  },
  {
    key: "deblockedBy",
    label: "Deblocked by",
    defaultVisible: true,
    value: (row) => textCell(row.deblockedBy),
  },
  {
    key: "order",
    label: "Order",
    defaultVisible: true,
    value: (row) => textCell(row.orderCode ?? String(row.orderId ?? "")),
  },
  {
    key: "orderCreatedAt",
    label: "Creation date of Order",
    defaultVisible: true,
    value: (row) => dateCell(row.orderCreatedAt),
  },
  {
    key: "orderAmount",
    label: "Order amount",
    defaultVisible: true,
    value: (row) => numberCell(row.orderAmount),
  },
  {
    key: "regionNumber",
    label: "Region number",
    defaultVisible: false,
    // `0` on every reference row, and nothing here numbers a region.
    value: () => null,
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
];
