import { OrderLineRow } from "@/app/(dashboard)/order-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { orderLineStatusLabel, userName } from "@/lib/helpers";

/**
 * The order lines overview as a sheet — see app/(dashboard)/orders/columns.ts.
 *
 * A function rather than a constant, because one column needs something the row
 * does not carry: the seller is stored as a Clerk id and Clerk owns the names.
 * The page already has that map for the table, and the export action fetches it
 * before writing the file, so both spell the seller the same way.
 */

export type OrderLineColumnKey =
  | "createdAt"
  | "deliveryDate"
  | "customerName"
  | "reference"
  | "orderId"
  | "lineNumber"
  | "lineStatus"
  | "productCode"
  | "description"
  | "options"
  | "lengthMm"
  | "widthMm"
  | "thicknessMm"
  | "quantity"
  | "unit"
  | "weightKg"
  | "price"
  | "costPrice"
  | "amount"
  | "profit"
  | "profitMargin"
  | "seller";

export const orderLineColumns = (
  userNames: Record<string, string>,
): Array<ExportColumn<OrderLineRow, OrderLineColumnKey>> => [
  {
    key: "createdAt",
    label: "Creation date",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "customerName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "reference",
    label: "Reference",
    defaultVisible: true,
    value: (row) => textCell(row.reference),
  },
  {
    key: "orderId",
    label: "Order",
    defaultVisible: true,
    value: (row) => numberCell(row.orderId),
  },
  {
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "lineStatus",
    label: "Line status",
    defaultVisible: true,
    value: (row) => orderLineStatusLabel(row.lineStatus),
  },
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "description",
    label: "Description",
    defaultVisible: true,
    value: (row) => textCell(row.description),
  },
  {
    key: "options",
    label: "Options",
    defaultVisible: true,
    value: (row) => textCell(row.options),
  },
  {
    key: "lengthMm",
    label: "Length (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.lengthMm),
  },
  {
    key: "widthMm",
    label: "Width (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.widthMm),
  },
  {
    key: "thicknessMm",
    label: "Thick. (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.thicknessMm),
  },
  {
    key: "quantity",
    label: "Quantity",
    defaultVisible: true,
    value: (row) => numberCell(row.quantity),
  },
  {
    key: "unit",
    label: "QtyU",
    defaultVisible: true,
    value: (row) => textCell(row.unit?.toUpperCase()),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "price",
    label: "Price",
    defaultVisible: true,
    value: (row) => numberCell(row.price),
  },
  {
    key: "costPrice",
    label: "Cost price",
    defaultVisible: true,
    value: (row) => numberCell(row.costPrice),
  },
  {
    key: "amount",
    label: "Amount",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
  },
  {
    key: "profit",
    label: "Profit",
    defaultVisible: true,
    value: (row) => numberCell(row.profit),
  },
  {
    key: "profitMargin",
    label: "Profit margin",
    defaultVisible: true,
    value: (row) => numberCell(row.profitMargin),
  },
  {
    key: "seller",
    label: "Seller",
    defaultVisible: true,
    value: (row) => textCell(userName(row.seller, userNames)),
  },
];
