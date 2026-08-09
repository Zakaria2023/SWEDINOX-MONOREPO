import { StockMovementListItem } from "@/app/(dashboard)/stock-movements/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/labels";

/**
 * The stock movements overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type StockMovementColumnKey =
  | "id"
  | "product"
  | "type"
  | "reason"
  | "note"
  | "quantity"
  | "source"
  | "createdAt";

/**
 * What caused the movement, as one readable phrase.
 *
 * A movement points at exactly one document — the screen renders whichever link
 * is set — so the sheet names that document rather than carrying four mostly
 * empty columns.
 */
const sourceOf = (row: StockMovementListItem): string | null => {
  if (row.purchaseOrderId) {
    return `Purchase Order #${row.purchaseOrderId}`;
  }
  if (row.purchaseInvoiceId) {
    return `Purchase Invoice #${row.purchaseInvoiceId}`;
  }
  if (row.orderId) {
    return `Order #${row.orderId}`;
  }
  if (row.invoiceId) {
    return `Invoice #${row.invoiceId}`;
  }
  return null;
};

export const STOCK_MOVEMENT_COLUMNS: Array<
  ExportColumn<StockMovementListItem, StockMovementColumnKey>
> = [
  { key: "id", label: "#", defaultVisible: true, value: (row) => row.id },
  {
    key: "product",
    label: "Product",
    defaultVisible: true,
    value: (row) =>
      textCell([row.productCode, row.productName].filter(Boolean).join(" — ")),
  },
  {
    key: "type",
    label: "Type",
    defaultVisible: true,
    value: (row) => STOCK_MOVEMENT_TYPE_LABELS[row.type],
  },
  {
    key: "reason",
    label: "Reason",
    defaultVisible: true,
    value: (row) => STOCK_MOVEMENT_REASON_LABELS[row.reason],
  },
  {
    key: "note",
    label: "Note",
    defaultVisible: true,
    // Shown under the reason on screen; a column of its own here, so the reason
    // stays something the sheet can be grouped by.
    value: (row) => textCell(row.note),
  },
  {
    key: "quantity",
    label: "Quantity",
    defaultVisible: true,
    value: (row) => numberCell(row.quantity),
  },
  {
    key: "source",
    label: "Source",
    defaultVisible: true,
    value: (row) => sourceOf(row),
  },
  {
    key: "createdAt",
    label: "Time",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
];
