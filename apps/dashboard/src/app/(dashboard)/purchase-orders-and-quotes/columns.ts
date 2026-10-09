import { PurchaseOrderQuoteRow } from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { documentStatusLabel } from "@/lib/helpers";
import {
  PURCHASE_ORDER_TYPE_LABELS,
  PURCHASE_QUOTE_EXPIRATION_REASON_LABELS,
} from "@/lib/labels";

/**
 * Purchase orders and quotes as a sheet — see app/(dashboard)/orders/columns.ts.
 *
 * All thirty columns the reference system shows, in its own order. Several only
 * mean anything on one of the two kinds — a quote has no delivery date, an
 * order has no validity — and those read blank on the other rather than being
 * dropped, because a column that disappears depending on the row is worse to
 * read than an empty cell.
 */

export type PurchaseOrderQuoteColumnKey =
  | "creationDate"
  | "year"
  | "month"
  | "timeFrame"
  | "number"
  | "purchaserInitials"
  | "purchaser"
  | "status"
  | "convertedNumber"
  | "lines"
  | "weightKg"
  | "revenue"
  | "supplierName"
  | "customerCode"
  | "deliveryDate"
  | "kind"
  | "orderType"
  | "expirationReason"
  | "quoteDate"
  | "internalText"
  | "consignment"
  | "sent"
  | "mustBeSent"
  | "orderMethod"
  | "deliberatelyNotSent"
  | "validUntil"
  | "affiliateCompany"
  | "classificationCode"
  | "classification"
  | "reference"
  | "ourReference";

export const PURCHASE_ORDER_QUOTE_COLUMNS: Array<
  ExportColumn<PurchaseOrderQuoteRow, PurchaseOrderQuoteColumnKey>
> = [
  {
    key: "creationDate",
    label: "Creation date",
    defaultVisible: true,
    value: (row) => dateCell(row.creationDate),
  },
  {
    key: "year",
    label: "Year (Creation date)",
    defaultVisible: true,
    value: (row) => numberCell(row.year),
  },
  {
    key: "month",
    label: "Month",
    defaultVisible: true,
    value: (row) => numberCell(row.month),
  },
  {
    key: "timeFrame",
    label: "Time frame",
    defaultVisible: true,
    value: (row) => textCell(row.timeFrame),
  },
  {
    key: "number",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) =>
      row.kind === "Return" ? `IR${row.number}` : numberCell(row.number),
  },
  {
    key: "purchaserInitials",
    label: "Initials",
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
    key: "status",
    label: "Status",
    defaultVisible: false,
    value: (row) => textCell(documentStatusLabel(row.kind, row.status)),
  },
  {
    key: "convertedNumber",
    label: "Converted from/to",
    defaultVisible: true,
    value: (row) => numberCell(row.convertedNumber),
  },
  {
    key: "lines",
    label: "Lines",
    defaultVisible: true,
    value: (row) => numberCell(row.lines),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "revenue",
    label: "Revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.revenue),
  },
  {
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => textCell(row.customerCode),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    // The reference's "Order type" is the purchase order type — Materials,
    // Processing, Customer materials — not whether the row is an order or a
    // quote; that is this screen's own "Document" column.
    key: "orderType",
    label: "Order type",
    defaultVisible: true,
    value: (row) =>
      textCell(row.orderType ? PURCHASE_ORDER_TYPE_LABELS[row.orderType] : null),
  },
  {
    key: "kind",
    label: "Document",
    defaultVisible: false,
    value: (row) => textCell(row.kind),
  },
  {
    key: "expirationReason",
    label: "Expiration reason",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.expirationReason
          ? PURCHASE_QUOTE_EXPIRATION_REASON_LABELS[row.expirationReason]
          : null,
      ),
  },
  {
    key: "quoteDate",
    label: "Quote date",
    defaultVisible: true,
    value: (row) => dateCell(row.quoteDate),
  },
  {
    key: "internalText",
    label: "Internal text",
    defaultVisible: true,
    value: (row) => textCell(row.internalText),
  },
  {
    key: "consignment",
    label: "Consignment",
    defaultVisible: true,
    value: (row) => (row.consignment === null ? null : yesNoCell(row.consignment)),
  },
  {
    key: "sent",
    label: "Send",
    defaultVisible: true,
    value: (row) => yesNoCell(row.sent),
  },
  {
    key: "mustBeSent",
    label: "Must be sent",
    defaultVisible: true,
    value: (row) => yesNoCell(row.mustBeSent),
  },
  {
    key: "orderMethod",
    label: "Order method",
    defaultVisible: false,
    value: (row) => textCell(row.orderMethod),
  },
  {
    key: "deliberatelyNotSent",
    label: "Deliberately not sent",
    defaultVisible: true,
    value: (row) => yesNoCell(row.deliberatelyNotSent),
  },
  {
    key: "validUntil",
    label: "Valid u/i",
    defaultVisible: true,
    value: (row) => dateCell(row.validUntil),
  },
  {
    key: "affiliateCompany",
    label: "Affiliate company",
    defaultVisible: true,
    value: (row) => textCell(row.affiliateCompany),
  },
  {
    key: "classificationCode",
    label: "Classification code",
    defaultVisible: true,
    value: (row) => textCell(row.classificationCode),
  },
  {
    // The reference carries the code and its description as two columns, the
    // same pair as "Payment terms code" and "Payment terms" on Purchase
    // invoices. Nobody has captured the list of codes, so the description
    // falls back to the code itself until that list exists — the column is
    // here, and it stops being a repetition the moment the lookup lands.
    key: "classification",
    label: "Classification",
    defaultVisible: true,
    value: (row) => textCell(row.classificationCode),
  },
  {
    key: "reference",
    label: "Reference",
    defaultVisible: false,
    value: (row) => textCell(row.reference),
  },
  {
    key: "ourReference",
    label: "Our reference",
    defaultVisible: false,
    value: (row) => textCell(row.ourReference),
  },
];
