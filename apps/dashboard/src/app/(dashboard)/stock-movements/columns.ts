import { StockMovementListItem } from "@/app/(dashboard)/stock-movements/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  timeCell,
  yesNoCell,
} from "@/lib/excel";
import {
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/labels";

// The account the reference books every stock row to (`3000` on all 13 562),
// and the one lib/server/ledger.ts posts lots to.
const STOCK_LEDGER_ACCOUNT = "3000";

/**
 * `Stock mutations` as the reference prints it — all 36 columns of its
 * `-empty-` view, in its own order (export of 9-9-2026,
 * docs/reference-system/stock-mutations.md), after our own `#`, `Type` and
 * `Source`, which link the row to its detail and its document.
 *
 * Quantities are **signed** the reference's way: outbound negative, inbound
 * positive, in every unit at once (`-25 ST  -1 226,563 kg  € -1 659,99`).
 */

export type StockMovementColumnKey =
  | "id"
  | "type"
  | "source"
  | "createdAt"
  | "operator"
  | "productCode"
  | "description"
  | "lengthMm"
  | "widthMm"
  | "quantity"
  | "stockUnit"
  | "quantityKg"
  | "internalCharge"
  | "reason"
  | "valueEur"
  | "workOrder"
  | "startDate"
  | "startingValue"
  | "startingKg"
  | "endDate"
  | "closingValue"
  | "closingKg"
  | "ledgerAccount"
  | "revenueGroup"
  | "standardProduct"
  | "stockProduct"
  | "companyCode"
  | "company"
  | "order"
  | "startingQty"
  | "closingQty"
  | "note"
  | "revenueGroupNumber"
  | "charge"
  | "purchaseOrder"
  | "receiptDate"
  | "supplier"
  | "internalBundle"
  | "quantityM1";

/** Out is negative, in positive; an `adjust` row moves no quantity. */
export const movementSign = (row: StockMovementListItem): number =>
  row.type === "out" ? -1 : 1;

const signed = (row: StockMovementListItem, value: string | null) =>
  value === null ? null : movementSign(row) * Number(value);

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

/**
 * `Workorder#` holds two series in one column: a warehouse or production work
 * order (`3xxxxx`) for goods moved in the building, a trip (`6xxxxx`) for goods
 * delivered — 4 189 of 5 043 customer deliveries name a trip.
 */
const workOrderOf = (row: StockMovementListItem): number | null =>
  row.warehouseWorkOrderNumber ??
  row.productionWorkOrderNumber ??
  row.tripNumber ??
  null;

/** `O101154` for a sales order, `IO400645` for a purchase order. */
const orderOf = (row: StockMovementListItem): string | null => {
  if (row.orderId) {
    return `O${row.orderId}`;
  }
  if (row.purchaseOrderId) {
    return `IO${row.purchaseOrderId}`;
  }
  return null;
};

export const STOCK_MOVEMENT_COLUMNS: Array<
  ExportColumn<StockMovementListItem, StockMovementColumnKey>
> = [
  { key: "id", label: "#", defaultVisible: true, value: (row) => row.id },
  {
    key: "type",
    label: "Type",
    defaultVisible: false,
    value: (row) => STOCK_MOVEMENT_TYPE_LABELS[row.type],
  },
  {
    key: "source",
    label: "Source",
    defaultVisible: false,
    value: (row) => sourceOf(row),
  },
  {
    key: "createdAt",
    label: "Mutation date / time",
    defaultVisible: true,
    value: (row) => {
      const day = dateCell(row.createdAt);
      const time = timeCell(row.createdAt);
      return day instanceof Date && time
        ? `${day.toISOString().slice(0, 10)} ${time}`
        : day;
    },
  },
  {
    key: "operator",
    label: "Mutation operator",
    defaultVisible: true,
    value: (row) => textCell(row.operatorName),
  },
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "description",
    label: "Description",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "lengthMm",
    label: "Length (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.lengthMm),
  },
  {
    key: "widthMm",
    label: "Width (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.widthMm),
  },
  {
    key: "quantity",
    label: "MutationQty (StkU)",
    defaultVisible: true,
    value: (row) => signed(row, row.quantity),
  },
  {
    key: "stockUnit",
    label: "StkU",
    defaultVisible: true,
    value: (row) => textCell(row.stockUnit),
  },
  {
    key: "quantityKg",
    label: "MutationQty (Kg)",
    defaultVisible: true,
    value: (row) => signed(row, row.quantityKg),
  },
  {
    key: "internalCharge",
    label: "Internal charge",
    defaultVisible: true,
    value: (row) => textCell(row.internalCharge),
  },
  {
    key: "reason",
    label: "Mutation reason",
    defaultVisible: true,
    value: (row) => STOCK_MOVEMENT_REASON_LABELS[row.reason],
  },
  {
    key: "valueEur",
    label: "MutationQty (€)",
    defaultVisible: true,
    value: (row) => signed(row, row.valueEur),
  },
  {
    key: "workOrder",
    label: "Workorder#",
    defaultVisible: true,
    value: (row) => workOrderOf(row),
  },
  {
    key: "startDate",
    label: "Start date",
    defaultVisible: false,
    value: (row) => dateCell(row.startDate),
  },
  {
    key: "startingValue",
    label: "Starting stock (€)",
    defaultVisible: false,
    value: (row) => row.startingValue,
  },
  {
    key: "startingKg",
    label: "Starting stock (Kg)",
    defaultVisible: false,
    value: (row) => row.startingKg,
  },
  {
    key: "endDate",
    label: "End date",
    defaultVisible: false,
    value: (row) => dateCell(row.endDate),
  },
  {
    key: "closingValue",
    label: "Closing stock (€)",
    defaultVisible: false,
    value: (row) => row.closingValue,
  },
  {
    key: "closingKg",
    label: "Closing stock (Kg)",
    defaultVisible: false,
    value: (row) => row.closingKg,
  },
  {
    // `3000` on every row of the reference's export, which is the stock
    // account our own ledger books lots to.
    key: "ledgerAccount",
    label: "General ledger account# Stock",
    defaultVisible: false,
    value: () => STOCK_LEDGER_ACCOUNT,
  },
  {
    key: "revenueGroup",
    label: "Revenue group",
    defaultVisible: false,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    key: "standardProduct",
    label: "Standard product",
    defaultVisible: false,
    value: (row) => yesNoCell(row.standardProduct),
  },
  {
    key: "stockProduct",
    label: "Stock product",
    defaultVisible: false,
    value: (row) => yesNoCell(row.stockProduct),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: false,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "company",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "order",
    label: "Order",
    defaultVisible: true,
    value: (row) => orderOf(row),
  },
  {
    key: "startingQty",
    label: "Starting stock (StkU)",
    defaultVisible: false,
    value: (row) => row.startingQty,
  },
  {
    key: "closingQty",
    label: "Closing stock (StkU)",
    defaultVisible: false,
    value: (row) => row.closingQty,
  },
  {
    key: "note",
    label: "Text",
    defaultVisible: false,
    value: (row) => textCell(row.note),
  },
  {
    key: "revenueGroupNumber",
    label: "Revenue group number",
    defaultVisible: false,
    value: (row) => numberCell(row.revenueGroupNumber),
  },
  {
    key: "charge",
    label: "Charge",
    defaultVisible: false,
    value: (row) => textCell(row.charge),
  },
  {
    key: "purchaseOrder",
    label: "Purchase order",
    defaultVisible: false,
    // The purchase the steel first came in on, stamped on the way out as well
    // as in — the reference names it on outbound rows too.
    value: (row) =>
      row.originPurchaseOrderId ?? row.purchaseOrderId
        ? `IO${row.originPurchaseOrderId ?? row.purchaseOrderId}`
        : null,
  },
  {
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: false,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "supplier",
    label: "Supplier",
    defaultVisible: false,
    value: (row) => textCell(row.originSupplierName),
  },
  {
    key: "internalBundle",
    label: "Internal Bundle",
    defaultVisible: false,
    value: (row) => textCell(row.internalBatch),
  },
  {
    // Running metres: quantity × length. `-25 ST` of 2 500 mm reads `-62,5`.
    key: "quantityM1",
    label: "MutationQty (M1)",
    defaultVisible: false,
    value: (row) =>
      row.lengthMm
        ? (movementSign(row) * Number(row.quantity) * row.lengthMm) / 1000
        : null,
  },
];
