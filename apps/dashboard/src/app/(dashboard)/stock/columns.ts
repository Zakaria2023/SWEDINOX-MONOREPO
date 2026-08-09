import { StockListItem } from "@/app/(dashboard)/stock/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { daysInSystem } from "@/lib/helpers";
import { STOCK_STATUS_LABELS } from "@/lib/labels";

/** The stock overview as a sheet — see app/(dashboard)/orders/columns.ts. */

export type StockColumnKey =
  | "product"
  | "companyName"
  | "purchaseOrderId"
  | "originalQuantity"
  | "quantity"
  | "reservedQuantity"
  | "availableQuantity"
  | "status"
  | "pendingDays"
  | "createdAt";

// The screen pairs these into two columns to save width — "original / remaining"
// and "reserved / available". A sheet has no such pressure and every figure is
// something somebody sorts or sums on, so each gets a column of its own.
export const STOCK_COLUMNS: Array<ExportColumn<StockListItem, StockColumnKey>> =
  [
    {
      key: "product",
      label: "Product",
      defaultVisible: true,
      value: (row) =>
        textCell(
          [row.productCode, row.productName].filter(Boolean).join(" — "),
        ),
    },
    {
      key: "companyName",
      label: "Company",
      defaultVisible: true,
      value: (row) => textCell(row.companyName),
    },
    {
      key: "purchaseOrderId",
      label: "Purchase Order",
      defaultVisible: true,
      value: (row) => numberCell(row.purchaseOrderId),
    },
    {
      key: "originalQuantity",
      label: "Original",
      defaultVisible: true,
      value: (row) => numberCell(row.originalQuantity ?? row.quantity),
    },
    {
      key: "quantity",
      label: "Remaining",
      defaultVisible: true,
      value: (row) => numberCell(row.quantity),
    },
    {
      key: "reservedQuantity",
      label: "Reserved",
      defaultVisible: true,
      value: (row) => numberCell(row.reservedQuantity),
    },
    {
      key: "availableQuantity",
      label: "Available",
      defaultVisible: true,
      value: (row) => Number(row.quantity) - Number(row.reservedQuantity),
    },
    {
      key: "status",
      label: "Status",
      defaultVisible: true,
      value: (row) => (row.status ? STOCK_STATUS_LABELS[row.status] : null),
    },
    {
      key: "pendingDays",
      label: "Pending For (days)",
      defaultVisible: true,
      // Only a pending lot has been waiting; a received one has arrived.
      value: (row) =>
        row.status === "pending" ? daysInSystem(row.createdAt) : null,
    },
    {
      key: "createdAt",
      label: "Created",
      defaultVisible: true,
      value: (row) => dateCell(row.createdAt),
    },
  ];
