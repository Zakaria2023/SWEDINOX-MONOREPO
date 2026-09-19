import { DeliveryLineItem } from "@/app/(dashboard)/deliveries/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * Deliveries as a sheet — the seventeen columns the screen shows, in its order.
 *
 * The `Deliver` button the grid carries has no column here: it is an action, not
 * a fact about the line, and a sheet of buttons would export nothing.
 *
 * The seller is a Clerk id on the line and a name on the screen. The sheet
 * writes the id, because the export runs on the server where the name is not in
 * hand — and the id is what the line actually holds.
 */

export type DeliveryColumnKey =
  | "orderCategory"
  | "lineStatus"
  | "orderId"
  | "lineNumber"
  | "customerName"
  | "seller"
  | "isPickup"
  | "productCode"
  | "productName"
  | "lengthMm"
  | "widthMm"
  | "options"
  | "qtyPlanned"
  | "unit"
  | "deliveryStatus"
  | "deliveryDate"
  | "blockingReason";

export const DELIVERY_COLUMNS: Array<
  ExportColumn<DeliveryLineItem, DeliveryColumnKey>
> = [
  {
    key: "orderCategory",
    label: "Order type",
    defaultVisible: true,
    value: (row) => textCell(row.orderCategory),
  },
  {
    key: "lineStatus",
    label: "Line status",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null,
      ),
  },
  {
    key: "orderId",
    label: "Order",
    defaultVisible: true,
    value: (row) => numberCell(row.orderId),
  },
  {
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "customerName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "seller",
    label: "Seller",
    defaultVisible: true,
    value: (row) => textCell(row.seller),
  },
  {
    key: "isPickup",
    label: "Pick-up",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isPickup),
  },
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "productName",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "lengthMm",
    label: "Length",
    defaultVisible: true,
    value: (row) => numberCell(row.lengthMm),
  },
  {
    key: "widthMm",
    label: "Width",
    defaultVisible: true,
    value: (row) => numberCell(row.widthMm),
  },
  {
    key: "options",
    label: "Options",
    defaultVisible: true,
    value: (row) => textCell(row.options),
  },
  {
    key: "qtyPlanned",
    label: "Line Qty(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "unit",
    label: "StkU",
    defaultVisible: true,
    value: (row) => textCell(row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "deliveryStatus",
    label: "Delivery status",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.deliveryStatus ? DELIVERY_STATUS_LABELS[row.deliveryStatus] : null,
      ),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "blockingReason",
    label: "Blocking reason",
    defaultVisible: true,
    value: (row) => textCell(row.blockingReason),
  },
];
