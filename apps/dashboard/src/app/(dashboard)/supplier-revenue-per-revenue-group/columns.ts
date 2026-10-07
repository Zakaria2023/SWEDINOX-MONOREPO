import type { SupplierRevenuePerGroupRow } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/actions";
import {
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
} from "@/lib/excel";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";

/**
 * Supplier revenue per revenue group — all 12 columns of the reference's
 * export (361 rows), in its order, plus the average price per kilo this screen
 * has always shown, hidden by default.
 *
 * A surcharge row has no order type, no unit and no weight, as 85 of the
 * reference's rows have none.
 */

export type SupplierRevenuePerGroupColumnKey =
  | "supplierName"
  | "city"
  | "creditorNumber"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "sourceType"
  | "year"
  | "month"
  | "demand"
  | "priceUnit"
  | "revenue"
  | "weightKg"
  | "avgPricePerKg";

type Column = ExportColumn<
  SupplierRevenuePerGroupRow,
  SupplierRevenuePerGroupColumnKey
>;

const column = (
  key: SupplierRevenuePerGroupColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: SupplierRevenuePerGroupRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

export const SUPPLIER_REVENUE_PER_GROUP_COLUMNS: Column[] = [
  column("supplierName", "Supplier", true, (row) => textCell(row.supplierName)),
  column("city", "City", true, (row) => textCell(row.city)),
  column("creditorNumber", "Creditor number", true, (row) =>
    textCell(row.creditorNumber),
  ),
  column("revenueGroupNumber", "Revenue group number", true, (row) =>
    numberCell(row.revenueGroupNumber),
  ),
  column("revenueGroupName", "Revenue group", true, (row) =>
    textCell(row.revenueGroupName),
  ),
  column("sourceType", "Order type", true, (row) =>
    row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : null,
  ),
  column("year", "Year (Invoice date)", true, (row) => numberCell(row.year)),
  column("month", "Month (Invoice date)", true, (row) => numberCell(row.month)),
  column("demand", "Demand", true, (row) =>
    row.priceUnit === null ? null : numberCell(row.demand),
  ),
  column("priceUnit", "U.", true, (row) => textCell(row.priceUnit)),
  column("revenue", "Revenue", true, (row) => numberCell(row.revenue)),
  column("weightKg", "Weight (kg)", true, (row) => numberCell(row.weightKg)),
  column("avgPricePerKg", "Avg. € / kg", false, (row) =>
    numberCell(row.avgPricePerKg),
  ),
];
