import { ProductListItem } from "@/app/(dashboard)/products/actions";
import { SalesUnit } from "@/lib/enums";
import { ExportColumn, numberCell, textCell, yesNoCell } from "@/lib/excel";
import { SALES_UNIT_LABELS } from "@/lib/labels";

/** The products overview as a sheet — see app/(dashboard)/orders/columns.ts. */

export type ProductColumnKey =
  | "productCode"
  | "commodityCode"
  | "productGroup"
  | "name"
  | "stockProduct"
  | "standardProduct"
  | "length"
  | "widthDiameter"
  | "thickness"
  | "technicalStock"
  | "stockUnit"
  | "theoreticalWeight"
  | "weightUnit";

const unitLabel = (unit: string | null) =>
  unit ? (SALES_UNIT_LABELS[unit as SalesUnit] ?? unit) : null;

export const PRODUCT_COLUMNS: Array<
  ExportColumn<ProductListItem, ProductColumnKey>
> = [
  {
    key: "productCode",
    label: "Product Code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "commodityCode",
    label: "Commodity Code",
    defaultVisible: true,
    value: (row) => textCell(row.commodityCode),
  },
  {
    key: "productGroup",
    label: "Product Group",
    defaultVisible: true,
    value: (row) => textCell(row.productGroupName),
  },
  {
    key: "name",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.name),
  },
  {
    key: "stockProduct",
    label: "Stock Product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.stockProduct),
  },
  {
    key: "standardProduct",
    label: "Standard Product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.standardProduct),
  },
  {
    key: "length",
    label: "Length",
    defaultVisible: false,
    value: (row) => numberCell(row.length),
  },
  {
    key: "widthDiameter",
    label: "Width/Diameter",
    defaultVisible: false,
    value: (row) => numberCell(row.widthDiameter),
  },
  {
    key: "thickness",
    label: "Thickness",
    defaultVisible: false,
    value: (row) => numberCell(row.thickness),
  },
  {
    key: "technicalStock",
    label: "Technical Stock",
    defaultVisible: true,
    value: (row) => numberCell(row.technicalStock),
  },
  {
    key: "stockUnit",
    label: "StkU",
    defaultVisible: true,
    value: (row) => unitLabel(row.stockUnit),
  },
  {
    key: "theoreticalWeight",
    label: "Theor. Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.theoreticalWeight),
  },
  {
    key: "weightUnit",
    label: "WeightU",
    defaultVisible: true,
    value: (row) => unitLabel(row.weightUnit),
  },
];
