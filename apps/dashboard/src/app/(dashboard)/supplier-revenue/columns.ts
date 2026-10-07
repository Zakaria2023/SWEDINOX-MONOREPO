import type { SupplierRevenueRow } from "@/app/(dashboard)/supplier-revenue/actions";
import {
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
} from "@/lib/excel";

/**
 * Supplier revenue — all 8 columns of the reference's export, in its order.
 * `Country code` is the visiting address's country, which is free text here.
 */

export type SupplierRevenueColumnKey =
  | "supplierName"
  | "supplierCode"
  | "city"
  | "country"
  | "month"
  | "year"
  | "revenue"
  | "weightKg";

type Column = ExportColumn<SupplierRevenueRow, SupplierRevenueColumnKey>;

const column = (
  key: SupplierRevenueColumnKey,
  label: string,
  value: (row: SupplierRevenueRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible: true, value });

export const SUPPLIER_REVENUE_COLUMNS: Column[] = [
  column("supplierName", "Supplier", (row) => textCell(row.supplierName)),
  column("supplierCode", "Supplier code", (row) => numberCell(row.supplierCode)),
  column("city", "City", (row) => textCell(row.city)),
  column("country", "Country code", (row) => textCell(row.country)),
  column("month", "Month (Invoice date)", (row) => numberCell(row.month)),
  column("year", "Year (Invoice date)", (row) => numberCell(row.year)),
  column("revenue", "Revenue", (row) => numberCell(row.revenue)),
  column("weightKg", "Weight (kg)", (row) => numberCell(row.weightKg)),
];
