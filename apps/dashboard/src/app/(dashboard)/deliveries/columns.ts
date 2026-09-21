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
  ORDER_SOURCE_TYPE_LABELS,
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
  | "commercialBlock"
  | "financialBlock"
  | "transportBlock"
  | "lineType"
  | "qtyActual"
  | "kgPlanned"
  | "kgActual"
  | "deliveryDateActual"
  | "tripNumber"
  | "vehicle"
  | "transportStatus"
  | "invoiceId"
  | "invoicedProducts"
  | "invoicedOptions"
  | "theoreticalWeight"
  | "theoreticalWeightUnit"
  | "stockProduct"
  | "modifiedAt"
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
  {
    // Three blocking flags live on the line and they are near mutually
    // exclusive -- only 4 of the reference's 6 134 rows carry two at once.
    key: "commercialBlock",
    label: "Commercial blocked",
    defaultVisible: false,
    value: (row) => yesNoCell(row.commercialBlock),
  },
  {
    key: "financialBlock",
    label: "Financially blocked",
    defaultVisible: false,
    value: (row) => yesNoCell(row.financialBlock),
  },
  {
    // A transport-blocked line is never on a trip: zero exceptions in 6 134
    // rows. The trip column beside it is empty on exactly these.
    key: "transportBlock",
    label: "Transport blockage",
    defaultVisible: false,
    value: (row) => yesNoCell(row.transportBlock),
  },
  {
    key: "lineType",
    label: "Line type",
    defaultVisible: false,
    value: (row) =>
      textCell(
        row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : null,
      ),
  },
  {
    key: "qtyActual",
    label: "Line Qty(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyActual),
  },
  {
    key: "kgPlanned",
    label: "Kg(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPlanned),
  },
  {
    // Zero rather than empty when nothing has left yet -- the same sentinel
    // habit the reference uses on 788 of its rows.
    key: "kgActual",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
  },
  {
    key: "deliveryDateActual",
    label: "Delivery date (a)",
    defaultVisible: false,
    value: (row) => dateCell(row.reservationDate),
  },
  {
    key: "tripNumber",
    label: "Trip number",
    defaultVisible: true,
    value: (row) => numberCell(row.tripNumber),
  },
  {
    key: "vehicle",
    label: "Vehicle",
    defaultVisible: false,
    value: (row) => textCell(row.vehicle),
  },
  {
    // Where the lorry is, which is a third ladder: the line has its own
    // status and the goods have another.
    key: "transportStatus",
    label: "Transport status",
    defaultVisible: false,
    value: (row) => textCell(row.transportStatus),
  },
  {
    key: "invoiceId",
    label: "Invoice no.",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceId),
  },
  {
    key: "invoicedProducts",
    label: "Invoiced (Prod.)",
    defaultVisible: false,
    value: (row) => numberCell(Number(row.invoicedProducts ?? 0)),
  },
  {
    key: "invoicedOptions",
    label: "Invoiced (Opt.)",
    defaultVisible: false,
    value: (row) => numberCell(Number(row.invoicedOptions ?? 0)),
  },
  {
    // ⚠️ In `M3` this is a DENSITY in kilos per cubic metre -- 7 850 steel,
    // 8 000 stainless, 2 700 aluminium -- not a weight. 6 023 of the
    // reference's 6 134 rows are `M3`.
    key: "theoreticalWeight",
    label: "Theor. weight",
    defaultVisible: false,
    value: (row) => numberCell(row.theoreticalWeight),
  },
  {
    key: "theoreticalWeightUnit",
    label: "Theor. weight U.",
    defaultVisible: false,
    value: (row) => textCell(row.theoreticalWeightUnit),
  },
  {
    key: "stockProduct",
    label: "Stock product",
    defaultVisible: false,
    value: (row) => yesNoCell(row.stockProduct),
  },
  {
    key: "modifiedAt",
    label: "Modified on",
    defaultVisible: false,
    value: (row) => dateCell(row.updatedAt),
  },
];
