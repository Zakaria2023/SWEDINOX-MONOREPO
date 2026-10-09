import type { PurchaseOrderToReceiveRow } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";

/**
 * Purchase orders to be received as a sheet — see
 * app/(dashboard)/orders/columns.ts. One row per open purchase line, in the
 * order the screen has always shown them.
 */

export type PurchaseOrderToReceiveColumnKey =
  | "purchaseOrderId"
  | "lineNumber"
  | "productCode"
  | "supplierName"
  | "reference"
  | "companyCode"
  | "status"
  | "orderDate"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "kgPurchased"
  | "kgReceived"
  | "kgStillToReceive"
  | "orderAmount"
  | "purchaser";

export const PURCHASE_ORDER_TO_RECEIVE_COLUMNS: Array<
  ExportColumn<PurchaseOrderToReceiveRow, PurchaseOrderToReceiveColumnKey>
> = [
  {
    key: "purchaseOrderId",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) => numberCell(row.purchaseOrderId),
  },
  {
    // Lines are numbered in tens on the reference — 10, 20, 30.
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) =>
      numberCell(row.lineNumber === null ? null : row.lineNumber * 10),
  },
  {
    key: "productCode",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "supplierName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "reference",
    label: "Supplier reference",
    defaultVisible: true,
    value: (row) => textCell(row.reference),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) =>
      textCell(row.status ? PURCHASE_ORDER_STATUS_LABELS[row.status] : null),
  },
  {
    key: "orderDate",
    label: "Order date",
    defaultVisible: true,
    value: (row) => dateCell(row.orderDate),
  },
  {
    key: "revenueGroupNumber",
    label: "Group no.",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueGroupNumber),
  },
  {
    key: "revenueGroupName",
    label: "Revenue group",
    defaultVisible: true,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    key: "kgPurchased",
    label: "Kg purchased",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPurchased),
  },
  {
    key: "kgReceived",
    label: "Kg received",
    defaultVisible: true,
    value: (row) => numberCell(row.kgReceived),
  },
  {
    key: "kgStillToReceive",
    label: "Kg still to receive",
    defaultVisible: true,
    value: (row) => numberCell(row.kgStillToReceive),
  },
  {
    // The line's own amount — the screen is one row per line.
    key: "orderAmount",
    label: "Order amount",
    defaultVisible: true,
    value: (row) => numberCell(row.orderAmount),
  },
  {
    key: "purchaser",
    label: "Purchaser",
    defaultVisible: true,
    value: (row) => textCell(row.purchaser ?? row.purchaserInitials),
  },
];
