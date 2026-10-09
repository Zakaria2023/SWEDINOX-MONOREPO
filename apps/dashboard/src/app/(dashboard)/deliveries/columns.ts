import { DeliveryLineItem } from "@/app/(dashboard)/deliveries/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  ORDER_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * `Deliveries` — all 54 columns of the reference's export (6 134 lines,
 * docs/reference-system/deliveries.md), in its own order, after our
 * `Order category`.
 *
 * The `Deliver` button the grid carries has no column here: it is an action, not
 * a fact about the line, and a sheet of buttons would export nothing.
 *
 * The seller is a Clerk id on the line and a name on the screen. The sheet
 * writes the id, because the export runs on the server where the name is not in
 * hand — and the id is what the line actually holds.
 *
 * ⚪ Switched off in the reference and blank here for the same reason: `Bls`,
 * `Bls+P`, `Sawing` and `Drilling` are `False` and `Sawing type`, both saw
 * angles, `Machine` and `Drilling holes` empty on all 6 134 rows. `Modified
 * by` is not recorded on a line here.
 */

export type DeliveryColumnKey =
  | "orderCategory"
  | "customerName"
  | "orderId"
  | "orderType"
  | "isPickup"
  | "seller"
  | "commercialBlock"
  | "financialBlock"
  | "transportBlock"
  | "lineNumber"
  | "lineType"
  | "lineStatus"
  | "productCode"
  | "productName"
  | "lengthMm"
  | "widthMm"
  | "lineDeliveryDate"
  | "qtyPlanned"
  | "qtyActual"
  | "lineUnit"
  | "blasting"
  | "blastingPrimed"
  | "sawing"
  | "sawingType"
  | "leftSawAngle"
  | "rightSawAngle"
  | "machine"
  | "lastWarehouseWorkOrder"
  | "lastProductionWorkOrder"
  | "blockingReason"
  | "deliveryDate"
  | "deliveryDateActual"
  | "plannedDelivery"
  | "ready"
  | "delivered"
  | "unit"
  | "deliveryStatus"
  | "kgPlanned"
  | "kgActual"
  | "tripNumber"
  | "vehicle"
  | "options"
  | "transportStatus"
  | "invoiceId"
  | "invoicedProducts"
  | "invoicedOptions"
  | "theoreticalWeight"
  | "theoreticalWeightUnit"
  | "drilling"
  | "drillingHoles"
  | "stockProduct"
  | "stockProductSince"
  | "transportDate"
  | "modifiedAt"
  | "modifiedBy";

type Column = ExportColumn<DeliveryLineItem, DeliveryColumnKey>;

const column = (
  key: DeliveryColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: DeliveryLineItem) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const unitOf = (row: DeliveryLineItem) =>
  textCell(row.unit ? STOCK_UNIT_LABELS[row.unit] : null);

export const DELIVERY_COLUMNS: Column[] = [
  column("orderCategory", "Order category", false, (row) =>
    textCell(row.orderCategory),
  ),
  column("customerName", "Customer", true, (row) => textCell(row.customerName)),
  column("orderId", "Order", true, (row) => numberCell(row.orderId)),
  // Normal / Call-off / Rush — the header's order type, 6 001 / 122 / 11.
  column("orderType", "Order type", true, (row) =>
    row.orderType ? ORDER_TYPE_LABELS[row.orderType] : null,
  ),
  column("isPickup", "Pick-up", true, (row) => yesNoCell(row.isPickup)),
  column("seller", "Seller", true, (row) => textCell(row.seller)),
  // Three blocking flags live on the line and they are near mutually
  // exclusive — only 4 of the reference's 6 134 rows carry two at once.
  column("commercialBlock", "Commercial blocked", true, (row) =>
    yesNoCell(row.commercialBlock),
  ),
  column("financialBlock", "Financially blocked", true, (row) =>
    yesNoCell(row.financialBlock),
  ),
  // A transport-blocked line is never on a trip: zero exceptions in 6 134 rows.
  column("transportBlock", "Transport blockage", true, (row) =>
    yesNoCell(row.transportBlock),
  ),
  column("lineNumber", "Line", true, (row) => numberCell(row.lineNumber)),
  column("lineType", "Line type", true, (row) =>
    textCell(row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : null),
  ),
  column("lineStatus", "Line status", true, (row) =>
    textCell(row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null),
  ),
  column("productCode", "Product code", true, (row) => textCell(row.productCode)),
  column("productName", "Product", true, (row) => textCell(row.productName)),
  column("lengthMm", "Length (mm)", true, (row) => numberCell(row.lengthMm)),
  column("widthMm", "Width (mm)", true, (row) => numberCell(row.widthMm)),
  column("lineDeliveryDate", "Order line Deliv. Date", false, (row) =>
    dateCell(row.deliveryDate),
  ),
  column("qtyPlanned", "Line Qty(p)", true, (row) => numberCell(row.qtyPlanned)),
  column("qtyActual", "Line Qty(a)", true, (row) => numberCell(row.qtyActual)),
  column("lineUnit", "Line QtyU", false, unitOf),
  column("blasting", "Bls", false, () => yesNoCell(false)),
  column("blastingPrimed", "Bls+P", false, () => yesNoCell(false)),
  column("sawing", "Sawing", false, () => yesNoCell(false)),
  column("sawingType", "Sawing type", false, () => null),
  column("leftSawAngle", "L.Saw angle", false, () => null),
  column("rightSawAngle", "R.Saw angle", false, () => null),
  column("machine", "Machine", false, () => null),
  column("lastWarehouseWorkOrder", "Last Wrs. Wo.", false, (row) =>
    textCell(row.lastWarehouseWorkOrder),
  ),
  column("lastProductionWorkOrder", "Last Prod. Wo.", false, (row) =>
    numberCell(row.lastProductionWorkOrder),
  ),
  column("blockingReason", "Blocking reason", true, (row) =>
    textCell(row.blockingReason),
  ),
  column("deliveryDate", "Delivery date (p)", true, (row) =>
    dateCell(row.deliveryDate),
  ),
  column("deliveryDateActual", "Delivery date (a)", false, (row) =>
    dateCell(row.deliveredOn),
  ),
  column("plannedDelivery", "Planned Delivery", false, (row) =>
    row.plannedDeliveryQty || null,
  ),
  column("ready", "Ready", false, (row) => row.readyQty || null),
  column("delivered", "Delivered", false, (row) => row.deliveredQty || null),
  column("unit", "U(delivery)", false, unitOf),
  column("deliveryStatus", "Delivery status", true, (row) =>
    textCell(
      row.deliveryStatus ? DELIVERY_STATUS_LABELS[row.deliveryStatus] : null,
    ),
  ),
  column("kgPlanned", "Kg(p)", true, (row) => numberCell(row.kgPlanned)),
  // Zero rather than empty when nothing has left yet — the same sentinel habit
  // the reference uses on 788 of its rows.
  column("kgActual", "Kg(a)", true, (row) => numberCell(row.kgActual)),
  column("tripNumber", "Trip number", true, (row) => numberCell(row.tripNumber)),
  column("vehicle", "Vehicle", false, (row) => textCell(row.vehicle)),
  column("options", "All options", true, (row) => textCell(row.options)),
  // Where the lorry is: a third ladder beside the line's and the goods'.
  column("transportStatus", "Transport status", false, (row) =>
    textCell(row.transportStatus),
  ),
  column("invoiceId", "Invoice no.", true, (row) => numberCell(row.invoiceId)),
  column("invoicedProducts", "Invoiced (Prod.)", false, (row) =>
    numberCell(Number(row.invoicedProducts ?? 0)),
  ),
  column("invoicedOptions", "Invoiced (Opt.)", false, (row) =>
    numberCell(Number(row.invoicedOptions ?? 0)),
  ),
  // ⚠️ In `M3` this is a DENSITY in kilos per cubic metre — 7 850 steel,
  // 8 000 stainless, 2 700 aluminium — not a weight.
  column(
    "theoreticalWeight",
    "Theor. Weight (kg per Theor. Weight U.)",
    false,
    (row) => numberCell(row.theoreticalWeight),
  ),
  column("theoreticalWeightUnit", "Theor. Weight U.", false, (row) =>
    textCell(row.theoreticalWeightUnit),
  ),
  column("drilling", "Drilling", false, () => yesNoCell(false)),
  column("drillingHoles", "Drilling holes", false, () => null),
  column("stockProduct", "Stock product", false, (row) =>
    yesNoCell(row.stockProduct),
  ),
  column("stockProductSince", "Stock product adjusted", false, (row) =>
    dateCell(row.stockProductSince),
  ),
  column("transportDate", "Transport date", false, (row) =>
    dateCell(row.transportDate),
  ),
  column("modifiedAt", "Modified on", false, (row) => dateCell(row.updatedAt)),
  column("modifiedBy", "Modified by", false, () => null),
];
