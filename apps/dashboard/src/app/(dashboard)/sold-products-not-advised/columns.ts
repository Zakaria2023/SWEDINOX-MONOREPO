import { SoldProductNotAdvisedRow } from "@/app/(dashboard)/sold-products-not-advised/actions";
import { ExportColumn, numberCell, textCell, yesNoCell } from "@/lib/excel";

/**
 * Sold products not on the order recommendation as a sheet — see
 * app/(dashboard)/orders/columns.ts.
 *
 * All thirteen columns the reference system prints, in its own order and under
 * its own headings, down to the inconsistent unit suffix on "Stock (Stk.U.)"
 * and "Available (StkU)" — see
 * docs/reference-system/purchase/sold-products-not-advised.md. Every one is
 * visible by default, because the reference grid shows all thirteen at once.
 */

export type SoldProductNotAdvisedColumnKey =
  | "mainGroup"
  | "productGroup"
  | "productCode"
  | "productName"
  | "stockProduct"
  | "standardProduct"
  | "avgMonthlyConsumption"
  | "revenue"
  | "sales"
  | "stock"
  | "available"
  | "stockUnit"
  | "pacClassification";

export const SOLD_PRODUCT_NOT_ADVISED_COLUMNS: Array<
  ExportColumn<SoldProductNotAdvisedRow, SoldProductNotAdvisedColumnKey>
> = [
  {
    key: "mainGroup",
    label: "Main group",
    defaultVisible: true,
    value: (row) => textCell(row.mainGroup),
  },
  {
    key: "productGroup",
    label: "Product group",
    defaultVisible: true,
    value: (row) => textCell(row.productGroup),
  },
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "productName",
    label: "Description",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "stockProduct",
    label: "Stock product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.stockProduct),
  },
  {
    key: "standardProduct",
    label: "Standard product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.standardProduct),
  },
  {
    key: "avgMonthlyConsumption",
    label: "Avg. Monthly consumption last year (Stk.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.avgMonthlyConsumption),
  },
  {
    key: "revenue",
    label: "Revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.revenue),
  },
  {
    key: "sales",
    label: "Sales",
    defaultVisible: true,
    value: (row) => numberCell(row.sales),
  },
  {
    key: "stock",
    label: "Stock (Stk.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.stock),
  },
  {
    key: "available",
    label: "Available (StkU)",
    defaultVisible: true,
    value: (row) => numberCell(row.available),
  },
  {
    key: "stockUnit",
    label: "Stock U.",
    defaultVisible: true,
    value: (row) => textCell(row.stockUnit),
  },
  {
    key: "pacClassification",
    label: "PAC-Code",
    defaultVisible: true,
    value: (row) => textCell(row.pacClassification),
  },
];
