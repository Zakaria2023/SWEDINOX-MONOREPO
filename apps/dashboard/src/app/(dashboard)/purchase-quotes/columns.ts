import { PurchaseQuoteLineRow } from "@/app/(dashboard)/purchase-quotes/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  PURCHASE_QUOTE_EXPIRATION_REASON_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * The purchase quotes overview as a sheet — see app/(dashboard)/orders/columns.ts.
 * Column for column the reference's 27, in its own order.
 */

export type PurchaseQuoteLineColumnKey =
  | "supplierName"
  | "quoteDate"
  | "validUntil"
  | "quoteNumber"
  | "quoteId"
  | "lineNumber"
  | "status"
  | "expirationReason"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "productCode"
  | "productDescription"
  | "lengthMm"
  | "widthMm"
  | "quantity"
  | "unit"
  | "kg"
  | "netPrice"
  | "priceUnit"
  | "amount"
  | "companyCode"
  | "internalText"
  | "isConsignment"
  | "purchaserInitials"
  | "purchaser"
  | "ourReference"
  | "purchaseReference";

export const PURCHASE_QUOTE_LINE_COLUMNS: Array<
  ExportColumn<PurchaseQuoteLineRow, PurchaseQuoteLineColumnKey>
> = [
  {
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "quoteDate",
    label: "Quote date",
    defaultVisible: true,
    value: (row) => dateCell(row.quoteDate),
  },
  {
    key: "validUntil",
    label: "Valid u/i",
    defaultVisible: true,
    value: (row) => dateCell(row.validUntil),
  },
  {
    key: "quoteNumber",
    label: "Quote nr. supplier",
    defaultVisible: true,
    value: (row) => textCell(row.quoteNumber),
  },
  {
    key: "quoteId",
    label: "Purchase quote",
    defaultVisible: true,
    value: (row) => numberCell(row.quoteId),
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
    value: (row) => PURCHASE_QUOTE_STATUS_LABELS[row.status],
  },
  {
    key: "expirationReason",
    label: "Expiration reason",
    defaultVisible: true,
    value: (row) =>
      row.expirationReason
        ? PURCHASE_QUOTE_EXPIRATION_REASON_LABELS[row.expirationReason]
        : null,
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
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "productDescription",
    label: "Product description",
    defaultVisible: true,
    value: (row) => textCell(row.productDescription),
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
    key: "quantity",
    label: "Quantity",
    defaultVisible: true,
    value: (row) => numberCell(row.quantity),
  },
  {
    key: "unit",
    label: "QtyU",
    defaultVisible: true,
    value: (row) => (row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "kg",
    label: "Kg",
    defaultVisible: true,
    value: (row) => numberCell(row.kg),
  },
  {
    key: "netPrice",
    label: "Net price",
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
    label: "Amount",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "internalText",
    label: "Internal Text",
    defaultVisible: true,
    value: (row) => textCell(row.internalText),
  },
  {
    key: "isConsignment",
    label: "Consignation",
    defaultVisible: true,
    value: (row) => (row.isConsignment ? "Yes" : "No"),
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
    key: "ourReference",
    label: "Our reference",
    defaultVisible: true,
    value: (row) => textCell(row.ourReference),
  },
  {
    key: "purchaseReference",
    label: "Purchase Reference",
    defaultVisible: true,
    value: (row) => textCell(row.purchaseReference),
  },
];
