import { BatchRow } from "@/app/(dashboard)/batches/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { CERTIFICAAT_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

/**
 * Batches as a sheet — the reference's 23 columns, in its order, all on its
 * screen.
 */

export type BatchColumnKey =
  | "purchaseOrder"
  | "supplierCode"
  | "supplier"
  | "productCode"
  | "product"
  | "length"
  | "width"
  | "qty"
  | "unit"
  | "kg"
  | "charge"
  | "internalCharge"
  | "sheetNumber"
  | "documentCode"
  | "fileName"
  | "mandatoryIgnoreDocument"
  | "receiptDate"
  | "thickness"
  | "stockCategory"
  | "qualityCode"
  | "documentCertificate"
  | "producer"
  | "options";

export const BATCH_COLUMNS: Array<ExportColumn<BatchRow, BatchColumnKey>> = [
  {
    key: "purchaseOrder",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) =>
      numberCell(row.purchaseOrderId ?? row.purchaseOrderCode),
  },
  {
    key: "supplierCode",
    label: "Supplier code",
    defaultVisible: true,
    value: (row) => numberCell(row.supplierCode),
  },
  {
    key: "supplier",
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
    key: "product",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "length",
    label: "Length",
    defaultVisible: true,
    value: (row) => numberCell(row.lengthMm),
  },
  {
    key: "width",
    label: "Width",
    defaultVisible: true,
    value: (row) => numberCell(row.widthMm),
  },
  {
    key: "qty",
    label: "Qty(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.qty),
  },
  {
    key: "unit",
    label: "Qty U",
    defaultVisible: true,
    value: (row) => textCell(row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "kg",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kg),
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
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: true,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "thickness",
    label: "Thickness",
    defaultVisible: true,
    value: (row) => numberCell(row.thicknessMm),
  },
  {
    key: "stockCategory",
    label: "Stock Category",
    defaultVisible: true,
    value: (row) => textCell(row.stockCategory),
  },
  {
    key: "qualityCode",
    label: "Quality Code",
    defaultVisible: true,
    value: (row) => textCell(row.qualityCode),
  },
  {
    key: "documentCertificate",
    label: "Document certificate",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.documentCertificate
          ? CERTIFICAAT_LABELS[row.documentCertificate]
          : null,
      ),
  },
  {
    key: "producer",
    label: "Producer",
    defaultVisible: true,
    value: (row) => textCell(row.producer),
  },
  {
    key: "options",
    label: "Options",
    defaultVisible: true,
    value: (row) => textCell(row.options),
  },
];
