import { OrderOrQuoteRow } from "@/app/(dashboard)/orders-and-quotes/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  monthLabel,
  salesDocumentStatusLabel,
  salesRepresentativeLabel,
  timeFrameOf,
} from "@/lib/helpers";
import {
  COMPANY_CLASSIFICATION_LABELS,
  ORDER_METHOD_LABELS,
} from "@/lib/labels";

/**
 * The sales document header as a sheet, in the reference's column order.
 *
 * All forty, in the reference's order. Seven are blank on **every one of 2 091
 * rows** there — `Pick-up slip`, `Converted from/to`, `Last follow-up`, `Last
 * follow-up reason`, `Internal Text`, `Classification code` and
 * `Classification` — and are carried anyway, hidden by default: a column that
 * is missing is work a reader has to go elsewhere for. The follow-up and
 * internal-text columns have no field behind them here and read blank.
 *
 * `Affiliate company details` is the branch's own legal name, from Settings.
 *
 * ⚠️ `Converted from/to` being blank says the feature is unused, **not** that
 * quote-to-order conversion is absent from the product. Only six quotes exist
 * in that database and none was converted.
 */

export type OrderOrQuoteColumnKey =
  | "createdAt"
  | "year"
  | "month"
  | "timeFrame"
  | "documentCode"
  | "sellerInitials"
  | "seller"
  | "status"
  | "convertedFromTo"
  | "lineCount"
  | "weightKg"
  | "revenue"
  | "profit"
  | "profitMargin"
  | "customerName"
  | "deliveryDate"
  | "orderType"
  | "representative"
  | "expirationReason"
  | "quoteDate"
  | "decisionDate"
  | "isConsignment"
  | "stillToSend"
  | "orderMethod"
  | "deliberatelyNotSent"
  | "mustBeSent"
  | "customerCode"
  | "validUntil"
  | "ourReference"
  | "reference"
  | "isPickup"
  | "isIncidental"
  | "pickupSlip"
  | "lastFollowUpDate"
  | "lastFollowUp"
  | "lastFollowUpReason"
  | "internalText"
  | "affiliateName"
  | "classificationCode"
  | "classification";

const initialsOf = (name: string | null): string | null => {
  if (!name) {
    return null;
  }
  const words = name.split(" ").filter(Boolean);
  if (words.length < 2) {
    return null;
  }
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
};

export const ORDER_OR_QUOTE_COLUMNS: Array<
  ExportColumn<OrderOrQuoteRow, OrderOrQuoteColumnKey>
> = [
  {
    key: "createdAt",
    label: "Creation date",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "year",
    label: "Year (Creation Date)",
    defaultVisible: true,
    value: (row) => numberCell(row.createdAt.getFullYear()),
  },
  {
    key: "month",
    label: "Month (Creation Date)",
    defaultVisible: true,
    value: (row) => textCell(monthLabel(row.createdAt.getMonth() + 1)),
  },
  {
    // Derived, not stored: the creation time floored to the half hour, which
    // the reference reproduces on all 2 091 of its rows.
    key: "timeFrame",
    label: "Time frame",
    defaultVisible: true,
    value: (row) => textCell(timeFrameOf(row.createdAt)),
  },
  {
    key: "documentCode",
    label: "Order/Quote",
    defaultVisible: true,
    value: (row) => textCell(row.documentCode),
  },
  {
    key: "sellerInitials",
    label: "Initials",
    defaultVisible: true,
    value: (row) => textCell(initialsOf(row.seller)),
  },
  {
    key: "seller",
    label: "Seller",
    defaultVisible: true,
    value: (row) => textCell(row.seller),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => textCell(salesDocumentStatusLabel(row.status)),
  },
  {
    key: "pickupSlip",
    label: "Pick-up slip",
    defaultVisible: true,
    value: () => null,
  },
  {
    key: "convertedFromTo",
    label: "Converted from/to",
    defaultVisible: true,
    value: (row) => textCell(row.convertedFromTo),
  },
  {
    key: "lineCount",
    label: "Lines",
    defaultVisible: true,
    value: (row) => numberCell(row.lineCount),
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
    key: "profit",
    label: "Profit",
    defaultVisible: true,
    value: (row) => numberCell(row.profit),
  },
  {
    // Divided by the size of the revenue, one decimal: a return carries
    // negative revenue, and dividing a negative profit by it would report a
    // loss as a gain.
    key: "profitMargin",
    label: "Profit margin",
    defaultVisible: true,
    value: (row) => numberCell(Number(row.profitMargin.toFixed(1))),
  },
  {
    key: "customerName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "orderType",
    label: "Order type",
    defaultVisible: true,
    value: (row) => textCell(row.orderType),
  },
  {
    // The account's owner, read from the customer. It is not the seller: the
    // reference shows documents typed by one person against another's
    // account.
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "expirationReason",
    label: "Expiration reason",
    defaultVisible: true,
    value: (row) => textCell(row.expirationReason),
  },
  {
    key: "quoteDate",
    label: "Quote date",
    defaultVisible: true,
    value: (row) => dateCell(row.quoteDate),
  },
  {
    key: "decisionDate",
    label: "Decision date",
    defaultVisible: true,
    value: (row) => dateCell(row.decisionDate),
  },
  {
    key: "lastFollowUpDate",
    label: "Last follow-up date",
    defaultVisible: true,
    value: () => null,
  },
  {
    key: "lastFollowUp",
    label: "Last follow-up",
    defaultVisible: true,
    value: () => null,
  },
  {
    key: "lastFollowUpReason",
    label: "Last follow-up reason",
    defaultVisible: true,
    value: () => null,
  },
  {
    key: "internalText",
    label: "Internal Text",
    defaultVisible: true,
    value: () => null,
  },
  {
    key: "isConsignment",
    label: "Consignment",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isConsignment),
  },
  {
    // Still to be sent, which is what the reference's `Send` means: meant to
    // go, not held back, and not yet printed, mailed or faxed.
    key: "stillToSend",
    label: "Send",
    defaultVisible: true,
    value: (row) => yesNoCell(row.stillToSend),
  },
  {
    key: "orderMethod",
    label: "Order method",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.orderMethod
          ? (ORDER_METHOD_LABELS[
              row.orderMethod as keyof typeof ORDER_METHOD_LABELS
            ] ?? row.orderMethod)
          : null,
      ),
  },
  {
    key: "deliberatelyNotSent",
    label: "Deliberately not sent",
    defaultVisible: true,
    value: (row) => yesNoCell(row.deliberatelyNotSent),
  },
  {
    key: "mustBeSent",
    label: "Must be sent",
    defaultVisible: true,
    value: (row) => yesNoCell(row.mustBeSent),
  },
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => numberCell(row.customerCode),
  },
  {
    key: "validUntil",
    label: "Valid u/i",
    defaultVisible: true,
    value: (row) => dateCell(row.validUntil),
  },
  {
    key: "affiliateName",
    label: "Affiliate company details",
    defaultVisible: true,
    value: (row) => textCell(row.affiliateName),
  },
  {
    key: "classificationCode",
    label: "Classification code",
    defaultVisible: true,
    value: (row) => textCell(row.classification),
  },
  {
    key: "classification",
    label: "Classification",
    defaultVisible: true,
    value: (row) =>
      row.classification ? COMPANY_CLASSIFICATION_LABELS[row.classification] : null,
  },
  {
    key: "ourReference",
    label: "Our reference",
    defaultVisible: true,
    value: (row) => textCell(row.ourReference),
  },
  {
    key: "reference",
    label: "Reference",
    defaultVisible: true,
    value: (row) => textCell(row.reference),
  },
  {
    key: "isPickup",
    label: "Pick-up",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isPickup),
  },
  {
    key: "isIncidental",
    label: "Incidental",
    defaultVisible: true,
    value: (row) => yesNoCell(row.isIncidental),
  },
];
