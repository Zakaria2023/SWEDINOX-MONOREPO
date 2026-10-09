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
    // The reference prints the document kind on every row of this screen, and
    // every row of it is a purchase order line.
    key: "documentKind",
    label: "Purchase order type",
    defaultVisible: true,
    value: () => textCell("Purchase order"),
  },
  {
    key: "purchaseOrderId",
    label: "No.",
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
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
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
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: true,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "qtyPlanned",
    label: "Qty(p) (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "unit",
    label: "Purchase U.",
    defaultVisible: true,
    value: (row) => (row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "kgPurchased",
    label: "Kg(pur)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPurchased),
  },
  {
    key: "reservedQty",
    label: "Reserved (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.reservedQty),
  },
  {
    key: "reservedKg",
    label: "Reserved (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.reservedKg),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => textCell(row.companyCode),
  },
  {
    key: "revenueGroupNumber",
    label: "Revenue group number",
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
    key: "lengthMm",
    label: "Length (mm)",
    defaultVisible: true,
    // 999999 is the reference's mark for coil, not a 999 metre bar.
    value: (row) =>
      row.lengthMm === COIL_LENGTH_SENTINEL ? null : numberCell(row.lengthMm),
  },
  {
    key: "widthMm",
    label: "Width (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.widthMm),
  },
  {
    key: "kgActual",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
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
    key: "qtyReceived",
    label: "Qty(a) (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyReceived),
  },
  {
    key: "qtyOrdered",
    label: "Qty ordered",
    defaultVisible: false,
    value: (row) => numberCell(row.qtyOrdered),
  },
  {
    key: "qtyConfirmed",
    label: "Qty confirmed",
    defaultVisible: false,
    value: (row) => numberCell(row.qtyConfirmed),
  },
  {
    key: "amountYetToBeReceived",
    label: "Amount yet to be received",
    defaultVisible: true,
    value: (row) => numberCell(row.amountYetToBeReceived),
  },
  {
    key: "qtyStillToReceive",
    label: "Qty still to be received",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyStillToReceive),
  },
  {
    key: "kgStillToReceive",
    label: "Kg. still to be received",
    defaultVisible: true,
    value: (row) => numberCell(row.kgStillToReceive),
  },
  {
    key: "orderType",
    label: "Purchase order type (materials)",
    defaultVisible: true,
    value: (row) =>
      textCell(row.orderType ? PURCHASE_ORDER_TYPE_LABELS[row.orderType] : null),
  },
  {
    key: "lineType",
    label: "Line type",
    defaultVisible: true,
    value: (row) => textCell(ORDER_SOURCE_TYPE_LABELS[row.lineType]),
  },
  {
    key: "purchaserInitials",
    label: "Initials purchaser",
    defaultVisible: true,
    value: (row) => textCell(row.purchaserInitials),
  },
  {
    key: "purchaser",
    label: "Purchaser",
    defaultVisible: true,
    value: (row) => textCell(row.purchaser),
  },
  {
    key: "mainGroup",
    label: "Main group",
    defaultVisible: true,
    value: (row) => textCell(row.mainGroup),
  },
  {
    key: "subgroup",
    label: "Subgroup",
    defaultVisible: true,
    value: (row) => textCell(row.subgroup),
  },
  {
    key: "grossPrice",
    label: "Current gross price",
    defaultVisible: true,
    value: (row) => numberCell(Number(row.grossPrice ?? 0)),
  },
  {
    // One unit governs both prices on a line, so the gross price is struck in
    // the same unit as the net one.
    key: "grossPriceUnit",
    label: "Gross price U",
    defaultVisible: true,
    value: (row) => textCell(row.priceUnit),
  },
  {
    key: "margin",
    label: "Margin (€ per gross unit)",
    defaultVisible: true,
    value: (row) => numberCell(row.margin),
  },
  {
    key: "ceStandard",
    label: "CE standard",
    defaultVisible: true,
    value: (row) =>
      textCell(row.ceStandard ? CE_STANDARD_LABELS[row.ceStandard] : null),
  },
  {
    // The date the line is due by, which the order sets for all of its lines.
    key: "deadline",
    label: "Deadline/Valid until",
    defaultVisible: true,
    value: (row) => dateCell(row.deadline),
  },
  {
    // The Declaration of Performance that pairs with the CE standard.
    key: "dop",
    label: "DoP",
    defaultVisible: true,
    value: (row) => textCell(row.dop),
  },
  {
    key: "thicknessMm",
    label: "Thickness",
    defaultVisible: true,
    value: (row) => numberCell(row.thicknessMm),
  },
  {
    key: "stockCategory",
    label: "Stock Category",
    defaultVisible: false,
    value: (row) => textCell(row.stockCategory),
  },
  {
    key: "qualityCode",
    label: "Quality Code",
    defaultVisible: false,
    value: (row) => textCell(row.qualityCode),
  },
  {
    key: "purchaseReference",
    label: "Purchase Reference",
    defaultVisible: true,
    value: (row) => textCell(row.purchaseReference),
  },
  {
    key: "ourReference",
    label: "Our reference",
    defaultVisible: true,
    value: (row) => textCell(row.ourReference),
  },
  {
    key: "createdAt",
    label: "Date Created",
    defaultVisible: false,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "options",
    label: "Options",
    defaultVisible: false,
    value: (row) => textCell(row.options),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
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
    defaultVisible: true,
    value: (row) => numberCell(row.availableKg),
  },
];
