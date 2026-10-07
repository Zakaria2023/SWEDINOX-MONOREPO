import type { RevenuePerProductRow } from "@/app/(dashboard)/revenue-per-product/actions";
import { dateCell, ExportCellValue, ExportColumn, textCell } from "@/lib/excel";
import { profitMarginPercent } from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";
import type { OrderSourceType } from "@/lib/enums";

/**
 * `Revenue per product` — all 21 columns of the reference's export, in its
 * order.
 *
 * The hierarchy reads top-down: `Product group` is the root, `Subgroup3` the
 * article's own group, `Subgroup2` the one above it, `Subgroup1` the one above
 * that. `Subgroup0` is blank on all 2 782 reference rows. `Option 1` and
 * `Option 2` are the first two options worked on the line.
 *
 * ⚠️ The reference exports `Profit margin` as a fraction (`0,116`); this
 * screen shows it as a percentage, like every other margin here.
 */

export type RevenuePerProductColumnKey =
  | "productGroup"
  | "subgroup0"
  | "subgroup1"
  | "subgroup2"
  | "subgroup3"
  | "productCode"
  | "productName"
  | "year"
  | "month"
  | "invoiceDate"
  | "orderCategory"
  | "orderType"
  | "option1"
  | "option2"
  | "sales"
  | "unit"
  | "weightKg"
  | "revenue"
  | "profit"
  | "profitMargin"
  | "invoiceLines";

type Column = ExportColumn<RevenuePerProductRow, RevenuePerProductColumnKey>;

const column = (
  key: RevenuePerProductColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: RevenuePerProductRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

/** The chain is nearest first; `depth` counts down from the root. */
const level = (row: RevenuePerProductRow, fromArticle: number) =>
  row.groupChain.length > fromArticle + 1
    ? (row.groupChain[fromArticle] ?? null)
    : null;

const optionAt = (row: RevenuePerProductRow, index: number) =>
  textCell(row.options?.split(",")[index]?.trim());

export const REVENUE_PER_PRODUCT_COLUMNS: Column[] = [
  column("productGroup", "Product group", true, (row) =>
    textCell(row.groupChain[row.groupChain.length - 1]),
  ),
  column("subgroup0", "Subgroup0", false, () => null),
  column("subgroup1", "Subgroup1", false, (row) => level(row, 2)),
  column("subgroup2", "Subgroup2", false, (row) => level(row, 1)),
  column("subgroup3", "Subgroup3", true, (row) => level(row, 0)),
  column("productCode", "Product code", true, (row) => textCell(row.productCode)),
  column("productName", "Product description", true, (row) =>
    textCell(row.productName),
  ),
  column("year", "Year (Invoice date)", false, (row) =>
    row.invoiceDate ? Number(row.invoiceDate.slice(0, 4)) : null,
  ),
  column("month", "Month (Invoice date)", false, (row) =>
    row.invoiceDate ? Number(row.invoiceDate.slice(5, 7)) : null,
  ),
  column("invoiceDate", "Invoice date", true, (row) => dateCell(row.invoiceDate)),
  column("orderCategory", "Order category", false, (row) =>
    textCell(row.orderCategory),
  ),
  column("orderType", "Order type", true, (row) =>
    row.sourceType
      ? ORDER_SOURCE_TYPE_LABELS[row.sourceType as OrderSourceType]
      : null,
  ),
  column("option1", "Option 1", false, (row) => optionAt(row, 0)),
  column("option2", "Option 2", false, (row) => optionAt(row, 1)),
  column("sales", "Sales", true, (row) => row.sales),
  column("unit", "U", true, (row) => textCell(row.priceUnit?.toUpperCase())),
  column("weightKg", "Weight (kg)", true, (row) => row.weightKg),
  column("revenue", "Revenue", true, (row) => row.revenue),
  column("profit", "Profit", true, (row) => row.profit),
  column("profitMargin", "Profit margin", true, (row) =>
    profitMarginPercent(row.revenue, row.profit),
  ),
  column("invoiceLines", "#Invoice lines", true, (row) => row.invoiceLines),
];
