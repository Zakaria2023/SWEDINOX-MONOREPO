import type { PurchaseInvoiceToReceiveRow } from "@/app/(dashboard)/purchase-invoices-to-be-received/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";

/**
 * Purchase invoices to be received as a sheet — see
 * app/(dashboard)/orders/columns.ts. One row per received, not-yet-invoiced
 * purchase order, in the order the screen has always shown them.
 */

export type PurchaseInvoiceToReceiveColumnKey =
  | "purchaseOrderId"
  | "supplierName"
  | "reference"
  | "companyCode"
  | "city"
  | "orderDate"
  | "paymentTerms"
  | "scheduledDeliveryDate"
  | "actualDeliveryDate"
  | "amount";

export const PURCHASE_INVOICE_TO_RECEIVE_COLUMNS: Array<
  ExportColumn<PurchaseInvoiceToReceiveRow, PurchaseInvoiceToReceiveColumnKey>
> = [
  {
    key: "purchaseOrderId",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) => numberCell(row.purchaseOrderId),
  },
  {
    key: "supplierName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "reference",
    label: "Supplier reference",
    defaultVisible: true,
    value: (row) => textCell(row.reference),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "orderDate",
    label: "Order date",
    defaultVisible: true,
    value: (row) => dateCell(row.orderDate),
  },
  {
    key: "paymentTerms",
    label: "Payment terms",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms] : null,
      ),
  },
  {
    key: "scheduledDeliveryDate",
    label: "Scheduled delivery",
    defaultVisible: true,
    value: (row) => dateCell(row.scheduledDeliveryDate),
  },
  {
    key: "actualDeliveryDate",
    label: "Actual delivery",
    defaultVisible: true,
    value: (row) => dateCell(row.actualDeliveryDate),
  },
  {
    // The received lines' own amounts, summed — not the header total.
    key: "amount",
    label: "Amount",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
  },
];
