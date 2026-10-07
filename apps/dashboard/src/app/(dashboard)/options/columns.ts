import type { OptionLineRow } from "@/app/(dashboard)/options/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { documentProfitMarginPercent } from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  ORDER_TYPE_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

/**
 * `Options` — all 31 columns of the reference's export (2 890 option rows,
 * docs/reference-system/sales-options-and-calloff.md), in its own order. One
 * row per option charged on an order line.
 */

export type OptionLineColumnKey =
  | "order"
  | "ourReference"
  | "orderLine"
  | "createdAt"
  | "productCode"
  | "description"
  | "customerCode"
  | "customer"
  | "city"
  | "lineType"
  | "lineStatus"
  | "optionCode"
  | "option"
  | "revenueGroupNumber"
  | "revenueGroup"
  | "quantity"
  | "quantityUnit"
  | "lengthMm"
  | "widthMm"
  | "weightKg"
  | "netPrice"
  | "priceUnit"
  | "costPrice"
  | "revenue"
  | "profit"
  | "profitMargin"
  | "deliveryDate"
  | "orderType"
  | "consignment"
  | "reference"
  | "representative";

type Column = ExportColumn<OptionLineRow, OptionLineColumnKey>;

const column = (
  key: OptionLineColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: OptionLineRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

export const OPTION_LINE_COLUMNS: Column[] = [
  column("order", "Order", true, (row) =>
    row.orderId === null ? null : `O${row.orderId}`,
  ),
  column("ourReference", "Our reference", false, (row) =>
    textCell(row.ourReference),
  ),
  column("orderLine", "Order line", true, (row) => numberCell(row.lineNumber)),
  column("createdAt", "Creation date", true, (row) => dateCell(row.createdAt)),
  column("productCode", "Product code", true, (row) => textCell(row.productCode)),
  column("description", "Description", true, (row) => textCell(row.productName)),
  column("customerCode", "Customer code", false, (row) =>
    numberCell(row.customerCode),
  ),
  column("customer", "Customer", true, (row) => textCell(row.customerName)),
  column("city", "City", false, (row) => textCell(row.city)),
  column("lineType", "Line type", false, (row) =>
    row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : null,
  ),
  column("lineStatus", "Line status", true, (row) =>
    row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null,
  ),
  column("optionCode", "Option code", true, (row) => textCell(row.optionCode)),
  column("option", "Option", true, (row) => textCell(row.optionName)),
  column("revenueGroupNumber", "Revenue group number", false, (row) =>
    numberCell(row.revenueGroupNumber),
  ),
  column("revenueGroup", "Revenue group", true, (row) =>
    textCell(row.revenueGroupName),
  ),
  column("quantity", "Quantity (QtyU)", true, (row) => numberCell(row.quantity)),
  column("quantityUnit", "QtyU", true, (row) => textCell(row.unit?.toUpperCase())),
  column("lengthMm", "Length (mm)", false, (row) => numberCell(row.lengthMm)),
  column("widthMm", "Width (mm)", false, (row) => numberCell(row.widthMm)),
  column("weightKg", "Weight (kg)", true, (row) => numberCell(row.weightKg)),
  column("netPrice", "Net price (PriceU)", true, (row) => numberCell(row.price)),
  column("priceUnit", "PriceU", true, (row) => textCell(row.priceUnit)),
  column("costPrice", "Cost price", false, (row) => numberCell(row.costPrice)),
  column("revenue", "Revenue", true, (row) => numberCell(row.amount)),
  column("profit", "Profit", true, (row) => numberCell(row.profit)),
  column("profitMargin", "Profit margin", true, (row) =>
    documentProfitMarginPercent(Number(row.amount ?? 0), Number(row.profit ?? 0)),
  ),
  column("deliveryDate", "Delivery date", false, (row) => dateCell(row.deliveryDate)),
  column("orderType", "Order type", false, (row) =>
    row.orderType ? ORDER_TYPE_LABELS[row.orderType] : null,
  ),
  column("consignment", "Consignment", false, (row) => yesNoCell(row.isConsignment)),
  column("reference", "Reference", false, (row) => textCell(row.customerRef)),
  column("representative", "Representative", false, (row) =>
    row.representative ? SALES_REPRESENTATIVE_LABELS[row.representative] : null,
  ),
];
