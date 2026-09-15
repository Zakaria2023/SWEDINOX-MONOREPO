import { PurchaseResultRow } from "@/app/(dashboard)/purchase-results/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";

/**
 * Purchase results as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type PurchaseResultColumnKey =
  | "mainGroup"
  | "subgroup"
  | "productCode"
  | "productName"
  | "year"
  | "month"
  | "receiptDate"
  | "purchaseValue";

export const PURCHASE_RESULT_COLUMNS: Array<
  ExportColumn<PurchaseResultRow, PurchaseResultColumnKey>
> = [
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
    key: "year",
    label: "Year",
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
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: true,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "purchaseValue",
    label: "Purchase value",
    defaultVisible: true,
    value: (row) => numberCell(row.purchaseValue),
  },
];
