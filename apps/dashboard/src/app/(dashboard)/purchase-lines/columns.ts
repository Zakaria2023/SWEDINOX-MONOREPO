import { PurchaseLineItem } from "@/app/(dashboard)/purchase-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  CE_STANDARD_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { COIL_LENGTH_SENTINEL } from "@/lib/helpers";

/**
 * The purchase lines overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type PurchaseLineColumnKey =
  | "createdAt"
  | "purchaseOrderId"
  | "lineNumber"
  | "status"
  | "supplierName"
  | "productCode"
  | "productName"
  | "qualityCode"
  | "stockCategory"
  | "options"
  | "lengthMm"
  | "widthMm"
  | "qtyPlanned"
  | "unit"
  | "reservedQty"
  | "kgPurchased"
  | "qtyReceived"
  | "qtyOrdered"
  | "qtyConfirmed"
  | "kgActual"
  | "kgStillToReceive"
  | "availableQty"
  | "availableKg"
  | "thicknessMm"
  | "netPrice"
  | "priceUnit"
  | "amount"
  | "amountYetToBeReceived"
  | "receiptDate"
  | "purchaser"
  | "purchaserInitials"
  | "documentKind"
  | "companyCode"
  | "country"
  | "orderType"
  | "lineType"
  | "qtyStillToReceive"
  | "reservedKg"
  | "grossPrice"
  | "grossPriceUnit"
  | "margin"
  | "mainGroup"
  | "subgroup"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "purchaseReference"
  | "ourReference"
  | "ceStandard"
  | "dop"
  | "deadline";

export const PURCHASE_LINE_COLUMNS: Array<
  ExportColumn<PurchaseLineItem, PurchaseLineColumnKey>
> = [
  {
    key: "createdAt",
    label: "Date created",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "purchaseOrderId",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) =>
      row.returnOrderId !== null
        ? `IR${row.returnOrderId}`
        : (row.purchaseOrderId ?? `#${row.id}`),
  },
  {
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) =>
      row.returnStatus
        ? PURCHASE_ORDER_STATUS_LABELS[row.returnStatus]
        : row.status
          ? ORDER_LINE_STATUS_LABELS[row.status]
          : null,
  },
  {
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
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
    key: "qualityCode",
    label: "Quality",
    defaultVisible: true,
    value: (row) => textCell(row.qualityCode),
  },
  {
    key: "stockCategory",
    label: "Stock category",
    defaultVisible: true,
    value: (row) => textCell(row.stockCategory),
  },
  {
    key: "options",
    label: "Options",
    defaultVisible: true,
    value: (row) => textCell(row.options),
  },
  {
    key: "lengthMm",
    label: "Length (mm)",
    defaultVisible: true,
    // 999999 is the reference's mark for coil, not a 999 metre bar.
    value: (row) =>
      row.lengthMm === COIL_LENGTH_SENTINEL ? null : numberCell(row.lengthMm),
  },
  {
    key: "widthMm",
    label: "Width",
    defaultVisible: true,
    value: (row) => numberCell(row.widthMm),
  },
  {
    key: "qtyPlanned",
    label: "Qty(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "unit",
    label: "U",
    defaultVisible: true,
    value: (row) => (row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "reservedQty",
    label: "Reserved",
    defaultVisible: true,
    value: (row) => numberCell(row.reservedQty),
  },
  {
    key: "kgPurchased",
    label: "Kg(pur)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPurchased),
  },
  {
    key: "qtyOrdered",
    label: "Qty ordered",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyOrdered),
  },
  {
    key: "qtyConfirmed",
    label: "Qty confirmed",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyConfirmed),
  },
  {
    key: "qtyReceived",
    label: "Qty(a) (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyReceived),
  },
  {
    key: "kgActual",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
  },
  {
    key: "kgStillToReceive",
    label: "Kg. still to be received",
    defaultVisible: true,
    value: (row) => numberCell(row.kgStillToReceive),
  },
  {
    key: "availableQty",
    label: "Available (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.availableQty),
  },
  {
    key: "availableKg",
    label: "Available (kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.availableKg),
  },
  {
    key: "thicknessMm",
    label: "Thickness",
    defaultVisible: false,
    value: (row) => numberCell(row.thicknessMm),
  },
  {
    key: "netPrice",
    label: "Net Purchase Price",
    defaultVisible: true,
    value: (row) => numberCell(row.netPrice),
  },
  {
    key: "priceUnit",
    label: "PriceU",
    defaultVisible: true,
    value: (row) => textCell(row.priceUnit),
  },
  {
    key: "amount",
    label: "Amount(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
  },
  {
    key: "amountYetToBeReceived",
    label: "Amount yet to be received",
    defaultVisible: true,
    value: (row) => numberCell(row.amountYetToBeReceived),
  },
  {
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: true,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "purchaser",
    label: "Purchaser",
    defaultVisible: true,
    value: (row) => textCell(row.purchaser),
  },
  {
    key: "purchaserInitials",
    label: "Initials purchaser",
    defaultVisible: false,
    value: (row) => textCell(row.purchaserInitials),
  },
  {
    // The reference prints the document kind on every row of this screen, and
    // every row of it is a purchase order line.
    key: "documentKind",
    label: "Purchase order type",
    defaultVisible: false,
    value: () => textCell("Purchase order"),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: false,
    value: (row) => textCell(row.companyCode),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: false,
    value: (row) => textCell(row.country),
  },
  {
    key: "orderType",
    label: "Purchase order type (materials)",
    defaultVisible: false,
    value: (row) =>
      textCell(row.orderType ? PURCHASE_ORDER_TYPE_LABELS[row.orderType] : null),
  },
  {
    key: "lineType",
    label: "Line type",
    defaultVisible: false,
    value: (row) => textCell(ORDER_SOURCE_TYPE_LABELS[row.lineType]),
  },
  {
    key: "qtyStillToReceive",
    label: "Qty still to be received",
    defaultVisible: false,
    value: (row) => numberCell(row.qtyStillToReceive),
  },
  {
    key: "reservedKg",
    label: "Reserved (kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.reservedKg),
  },
  {
    key: "grossPrice",
    label: "Current gross price",
    defaultVisible: false,
    value: (row) => numberCell(Number(row.grossPrice ?? 0)),
  },
  {
    // One unit governs both prices on a line, so the gross price is struck in
    // the same unit as the net one.
    key: "grossPriceUnit",
    label: "Gross price U",
    defaultVisible: false,
    value: (row) => textCell(row.priceUnit),
  },
  {
    key: "margin",
    label: "Margin (€ per gross unit)",
    defaultVisible: false,
    value: (row) => numberCell(row.margin),
  },
  {
    key: "mainGroup",
    label: "Main group",
    defaultVisible: false,
    value: (row) => textCell(row.mainGroup),
  },
  {
    key: "subgroup",
    label: "Subgroup",
    defaultVisible: false,
    value: (row) => textCell(row.subgroup),
  },
  {
    key: "revenueGroupNumber",
    label: "Revenue group number",
    defaultVisible: false,
    value: (row) => numberCell(row.revenueGroupNumber),
  },
  {
    key: "revenueGroupName",
    label: "Revenue group",
    defaultVisible: false,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    key: "purchaseReference",
    label: "Purchase Reference",
    defaultVisible: false,
    value: (row) => textCell(row.purchaseReference),
  },
  {
    key: "ourReference",
    label: "Our reference",
    defaultVisible: false,
    value: (row) => textCell(row.ourReference),
  },
  {
    key: "ceStandard",
    label: "CE standard",
    defaultVisible: false,
    value: (row) =>
      textCell(row.ceStandard ? CE_STANDARD_LABELS[row.ceStandard] : null),
  },
  {
    // The Declaration of Performance that pairs with the CE standard.
    key: "dop",
    label: "DoP",
    defaultVisible: false,
    value: (row) => textCell(row.dop),
  },
  {
    // The date the line is due by, which the order sets for all of its lines.
    key: "deadline",
    label: "Deadline/Valid until",
    defaultVisible: false,
    value: (row) => dateCell(row.deadline),
  },
];
