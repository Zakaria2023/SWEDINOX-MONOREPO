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
    label: "Year",
    defaultVisible: false,
    value: (row) => numberCell(row.year),
  },
  {
    key: "month",
    label: "Month",
    defaultVisible: false,
    value: (row) => numberCell(row.month),
  },
  {
    key: "timeFrame",
    label: "Time frame",
    defaultVisible: false,
    value: (row) => textCell(row.timeFrame),
  },
  {
    key: "number",
    label: "Number",
    defaultVisible: true,
    value: (row) => numberCell(row.number),
  },
  {
    key: "purchaserInitials",
    label: "Initials",
    defaultVisible: false,
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
    defaultVisible: true,
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
    defaultVisible: false,
    value: (row) => textCell(row.customerCode),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "kind",
    label: "Order type",
    defaultVisible: true,
    value: (row) => textCell(row.kind),
  },
  {
    key: "orderType",
    label: "Purchase type",
    defaultVisible: false,
    value: (row) =>
      textCell(row.orderType ? PURCHASE_ORDER_TYPE_LABELS[row.orderType] : null),
  },
  {
    key: "expirationReason",
    label: "Expiration reason",
    defaultVisible: false,
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
    defaultVisible: false,
    value: (row) => dateCell(row.quoteDate),
  },
  {
    key: "internalText",
    label: "Internal text",
    defaultVisible: false,
    value: (row) => textCell(row.internalText),
  },
  {
    key: "consignment",
    label: "Consignment",
    defaultVisible: false,
    value: (row) => (row.consignment === null ? null : yesNoCell(row.consignment)),
  },
  {
    key: "sent",
    label: "Sent",
    defaultVisible: false,
    value: (row) => yesNoCell(row.sent),
  },
  {
    key: "mustBeSent",
    label: "Must be sent",
    defaultVisible: false,
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
    defaultVisible: false,
    value: (row) => yesNoCell(row.deliberatelyNotSent),
  },
  {
    key: "validUntil",
    label: "Valid u/i",
    defaultVisible: false,
    value: (row) => dateCell(row.validUntil),
  },
  {
    key: "affiliateCompany",
    label: "Affiliate company",
    defaultVisible: false,
    value: (row) => textCell(row.affiliateCompany),
  },
  {
    key: "classificationCode",
    label: "Classification",
    defaultVisible: false,
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
