import { DeliveryCertificateRow } from "@/app/(dashboard)/sending-certificates/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { DELIVERY_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

/**
 * Sending certificates as a sheet.
 *
 * The screen shows six columns this file leaves out — `Internal reference`,
 * `Requested`, `Sending to`, `Document sent`, `Project` and `Use customer
 * stock`. Nothing backs them: no certificate has ever been sent in the
 * reference, so there is no request, no recipient and no sent date to write.
 * They render as placeholders on the grid and would export as empty columns,
 * which is worse than not exporting them.
 *
 * `Bill of lading` is exported because the column is real even though it is
 * always empty for now: the reference prints the *sales* bill of lading here
 * and our deliveries do not record one yet.
 */

export type DeliveryCertificateColumnKey =
  | "salesOrder"
  | "salesLine"
  | "customerCode"
  | "customerName"
  | "customerRef"
  | "productCode"
  | "productName"
  | "deliveryDate"
  | "billOfLading"
  | "lengthMm"
  | "widthMm"
  | "qtyActual"
  | "unit"
  | "kgActual"
  | "charge"
  | "internalCharge"
  | "sheetNumber"
  | "purchaseOrder"
  | "receiptDate"
  | "documentCode"
  | "fileName"
  | "mandatoryIgnoreDocument"
  | "deliveryStatus"
  | "options"
  | "thicknessMm"
  | "stockCategory"
  | "qualityCode"
  | "documentCertificate"
  | "producer";

export const DELIVERY_CERTIFICATE_COLUMNS: Array<
  ExportColumn<DeliveryCertificateRow, DeliveryCertificateColumnKey>
> = [
  {
    key: "salesOrder",
    label: "Sales order",
    defaultVisible: true,
    value: (row) => numberCell(row.salesOrder),
  },
  {
    key: "salesLine",
    label: "Sales line",
    defaultVisible: true,
    value: (row) => numberCell(row.salesLine),
  },
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => numberCell(row.customerCode),
  },
  {
    key: "customerName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "customerRef",
    label: "Customer reference",
    defaultVisible: true,
    value: (row) => textCell(row.customerRef),
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
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "billOfLading",
    label: "Bill of lading",
    defaultVisible: true,
    value: (row) => textCell(row.billOfLading),
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
    key: "qtyActual",
    label: "Qty (a)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyActual),
  },
  {
    key: "unit",
    label: "Qty U",
    defaultVisible: true,
    value: (row) => textCell(row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "kgActual",
    label: "Kg (a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
  },
  {
    key: "charge",
    label: "Charge",
    defaultVisible: true,
    value: (row) => textCell(row.charge),
  },
  {
    key: "internalCharge",
    label: "Internal charge",
    defaultVisible: true,
    value: (row) => textCell(row.internalCharge),
  },
  {
    key: "sheetNumber",
    label: "Sheet number",
    defaultVisible: true,
    value: (row) => textCell(row.sheetNumber),
  },
  {
    key: "purchaseOrder",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) => textCell(row.purchaseOrder),
  },
  {
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: true,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "documentCode",
    label: "Document code",
    defaultVisible: true,
    value: (row) => textCell(row.documentCode),
  },
  {
    key: "fileName",
    label: "Filename",
    defaultVisible: true,
    value: (row) => textCell(row.fileName),
  },
  {
    key: "mandatoryIgnoreDocument",
    label: "Mand. ign. doc.",
    defaultVisible: true,
    value: (row) => yesNoCell(row.mandatoryIgnoreDocument),
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
    key: "options",
    label: "Options",
    defaultVisible: true,
    value: (row) => textCell(row.options),
  },
  {
    key: "thicknessMm",
    label: "Thickness",
    defaultVisible: true,
    value: (row) => numberCell(row.thicknessMm),
  },
  {
    key: "stockCategory",
    label: "Stock category",
    defaultVisible: true,
    value: (row) => textCell(row.stockCategory),
  },
  {
    key: "qualityCode",
    label: "Quality code",
    defaultVisible: true,
    value: (row) => textCell(row.qualityCode),
  },
  {
    key: "documentCertificate",
    label: "Document certificate",
    defaultVisible: true,
    value: (row) => textCell(row.documentCertificate),
  },
  {
    key: "producer",
    label: "Producer",
    defaultVisible: true,
    value: (row) => textCell(row.producer),
  },
];
