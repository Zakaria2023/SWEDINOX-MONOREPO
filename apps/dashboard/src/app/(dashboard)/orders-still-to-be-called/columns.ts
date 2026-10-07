import type { CallOffLineRow } from "@/lib/server/call-off-lines";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  ORDER_LINE_STATUS_CODES,
  SALES_REPRESENTATIVE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * The two call-off screens' columns: all 49 of `Orders still to be called`
 * (B14) in its order, and the 26 of `Order lines still to be called` (B13) in
 * its own (docs/reference-system/sales-options-and-calloff.md §6–§7).
 *
 * `Line status` prints the reference's numeric code on both — `310`, `805`,
 * `810` — as these two screens do.
 *
 * Proved on B14, 674 of 691 rows:
 *   Amount to be delivered = Amount × (Quantity not yet delivered / Quantity)
 *   Weight to be delivered = Weight × (Quantity not yet delivered / Quantity)
 */

export type CallOffColumnKey =
  | "order"
  | "ourReference"
  | "productCode"
  | "description"
  | "orderLine"
  | "revenueGroupNumber"
  | "customerCode"
  | "customer"
  | "city"
  | "reference"
  | "earliestCallOff"
  | "lastCallOff"
  | "lineStatus"
  | "deliveryDate"
  | "quantity"
  | "quantityUnit"
  | "lengthMm"
  | "widthMm"
  | "weightKg"
  | "amount"
  | "notDelivered"
  | "weightToDeliver"
  | "amountToDeliver"
  | "representative"
  | "consignment"
  | "revenueGroup"
  | "consumptionLastYearKg"
  | "consumptionLast3MonthsKg"
  | "consumptionLastMonthKg"
  | "consumptionLastYear"
  | "consumptionLast3Months"
  | "consumptionLastMonth"
  | "stock"
  | "stockKg"
  | "stockUnit"
  | "onOrderKg"
  | "onOrder"
  | "dateOfArrival"
  | "purchasePrice"
  | "purchasePriceUnit"
  | "salesPrice"
  | "salesPriceUnit"
  | "lastOrderDate"
  | "minimumStock"
  | "minimumStockKg"
  | "minStockMethod"
  | "minStockFixedValue"
  | "minStockFactor"
  | "reservedStock";

type Column = ExportColumn<CallOffLineRow, CallOffColumnKey>;

const column = (
  key: CallOffColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: CallOffLineRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const notDelivered = (row: CallOffLineRow) =>
  Math.max(0, row.quantity - row.deliveredQty);

const share = (row: CallOffLineRow, total: number) =>
  row.quantity > 0 ? (total * notDelivered(row)) / row.quantity : 0;

/** The minimum stock in the stock unit, the way the product's policy sets it. */
const minimumStock = (row: CallOffLineRow): number =>
  row.minStockMode === "fixed_value"
    ? Number(row.minStockFixedValue ?? 0)
    : Number(row.minStockMultiplier ?? 0) * (row.consumptionLastYear / 12);

const blankZero = (value: number) => (value === 0 ? null : value);

const ALL: Record<CallOffColumnKey, Column> = {
  order: column("order", "Order", true, (row) => row.orderId),
  ourReference: column("ourReference", "Our reference", false, (row) =>
    textCell(row.ourReference),
  ),
  productCode: column("productCode", "Product code", true, (row) =>
    textCell(row.productCode),
  ),
  description: column("description", "Description", true, (row) =>
    textCell(row.description),
  ),
  orderLine: column("orderLine", "Order line", true, (row) =>
    numberCell(row.lineNumber),
  ),
  revenueGroupNumber: column(
    "revenueGroupNumber",
    "Revenue group number",
    false,
    (row) => numberCell(row.revenueGroupNumber),
  ),
  customerCode: column("customerCode", "Customer code", false, (row) =>
    row.customerCode,
  ),
  customer: column("customer", "Customer", true, (row) =>
    textCell(row.customerName),
  ),
  city: column("city", "City", false, (row) => textCell(row.city)),
  reference: column("reference", "Reference", true, (row) =>
    textCell(row.reference),
  ),
  earliestCallOff: column("earliestCallOff", "Earliest call-off date", true, (row) =>
    dateCell(row.callOffFrom),
  ),
  lastCallOff: column("lastCallOff", "Last call-off date", true, (row) =>
    dateCell(row.callOffTo),
  ),
  lineStatus: column("lineStatus", "Line status", true, (row) =>
    row.lineStatus ? ORDER_LINE_STATUS_CODES[row.lineStatus] : null,
  ),
  deliveryDate: column("deliveryDate", "Delivery date order line", true, (row) =>
    dateCell(row.deliveryDate),
  ),
  quantity: column("quantity", "Quantity (QtyU)", true, (row) => row.quantity),
  quantityUnit: column("quantityUnit", "QtyU", true, (row) =>
    row.unit ? STOCK_UNIT_LABELS[row.unit] : null,
  ),
  lengthMm: column("lengthMm", "Length (mm)", false, (row) =>
    numberCell(row.lengthMm),
  ),
  widthMm: column("widthMm", "Width (mm)", false, (row) =>
    numberCell(row.widthMm),
  ),
  weightKg: column("weightKg", "Weight (kg)", true, (row) => row.weightKg),
  amount: column("amount", "Amount", true, (row) => row.amount),
  notDelivered: column(
    "notDelivered",
    "Quantity not yet delivered",
    true,
    (row) => blankZero(notDelivered(row)),
  ),
  weightToDeliver: column(
    "weightToDeliver",
    "Weight to be delivered",
    true,
    (row) => blankZero(share(row, row.weightKg)),
  ),
  amountToDeliver: column(
    "amountToDeliver",
    "Amount to be delivered",
    true,
    (row) => blankZero(share(row, row.amount)),
  ),
  representative: column("representative", "Representative", false, (row) =>
    row.representative ? SALES_REPRESENTATIVE_LABELS[row.representative] : null,
  ),
  consignment: column("consignment", "Consignment", false, (row) =>
    yesNoCell(row.consignment),
  ),
  revenueGroup: column("revenueGroup", "Revenue group", false, (row) =>
    textCell(row.revenueGroupName),
  ),
  consumptionLastYearKg: column(
    "consumptionLastYearKg",
    "Consumption last year (kg)",
    false,
    (row) => blankZero(row.consumptionLastYearKg),
  ),
  consumptionLast3MonthsKg: column(
    "consumptionLast3MonthsKg",
    "Consumption last 3 months (kg)",
    false,
    (row) => blankZero(row.consumptionLast3MonthsKg),
  ),
  consumptionLastMonthKg: column(
    "consumptionLastMonthKg",
    "Consumption last month (kg)",
    false,
    (row) => blankZero(row.consumptionLastMonthKg),
  ),
  consumptionLastYear: column(
    "consumptionLastYear",
    "Consumption last year",
    false,
    (row) => blankZero(row.consumptionLastYear),
  ),
  consumptionLast3Months: column(
    "consumptionLast3Months",
    "Consumption last 3 months",
    false,
    (row) => blankZero(row.consumptionLast3Months),
  ),
  consumptionLastMonth: column(
    "consumptionLastMonth",
    "Consumption last month",
    false,
    (row) => blankZero(row.consumptionLastMonth),
  ),
  stock: column("stock", "Stock", false, (row) => blankZero(row.stock)),
  stockKg: column("stockKg", "Stock (Kg)", false, (row) => blankZero(row.stockKg)),
  stockUnit: column("stockUnit", "Stock U.", false, (row) => textCell(row.stockUnit)),
  onOrderKg: column("onOrderKg", "On order (kg)", false, (row) =>
    blankZero(row.onOrderKg),
  ),
  onOrder: column("onOrder", "On order", false, (row) => blankZero(row.onOrder)),
  dateOfArrival: column("dateOfArrival", "Date of arrival", false, (row) =>
    dateCell(row.dateOfArrival),
  ),
  purchasePrice: column("purchasePrice", "Purchase price", false, (row) =>
    row.purchasePrice,
  ),
  purchasePriceUnit: column(
    "purchasePriceUnit",
    "Purchase price U.",
    false,
    (row) => textCell(row.purchasePriceUnit),
  ),
  salesPrice: column("salesPrice", "Sales price", false, (row) =>
    numberCell(row.netPrice),
  ),
  salesPriceUnit: column("salesPriceUnit", "Sales price U.", false, (row) =>
    textCell(row.priceUnit),
  ),
  lastOrderDate: column("lastOrderDate", "Last order date", false, (row) =>
    dateCell(row.lastOrderDate),
  ),
  minimumStock: column("minimumStock", "Minimum stock", false, (row) =>
    blankZero(minimumStock(row)),
  ),
  // In kilos at the product's own weight per unit, read off its stock.
  minimumStockKg: column("minimumStockKg", "Minimum stock (Kg)", false, (row) =>
    row.stock > 0 ? blankZero((minimumStock(row) * row.stockKg) / row.stock) : null,
  ),
  minStockMethod: column("minStockMethod", "Min. Stk. Method", false, (row) =>
    `${Math.round(minimumStock(row) * 100) / 100} (${
      row.minStockMode === "fixed_value" ? "Fixed value" : "Factor x Avg.Mnt.Usg."
    })`,
  ),
  minStockFixedValue: column(
    "minStockFixedValue",
    "Min. Stk. Fixed value",
    false,
    (row) => blankZero(Number(row.minStockFixedValue ?? 0)),
  ),
  minStockFactor: column(
    "minStockFactor",
    "Min. Stk. Factor Avg.Mon.Cons.",
    false,
    (row) => numberCell(row.minStockMultiplier),
  ),
  reservedStock: column("reservedStock", "Reserved stock", false, (row) =>
    blankZero(row.reservedStock),
  ),
};

const pick = (keys: CallOffColumnKey[]): Column[] => keys.map((key) => ALL[key]);

/** B14, all 49 in the reference's order. */
export const ORDERS_STILL_TO_BE_CALLED_COLUMNS = pick([
  "order",
  "ourReference",
  "productCode",
  "description",
  "orderLine",
  "revenueGroupNumber",
  "customerCode",
  "customer",
  "city",
  "reference",
  "earliestCallOff",
  "lastCallOff",
  "lineStatus",
  "deliveryDate",
  "quantity",
  "quantityUnit",
  "lengthMm",
  "widthMm",
  "weightKg",
  "amount",
  "notDelivered",
  "weightToDeliver",
  "amountToDeliver",
  "representative",
  "consignment",
  "revenueGroup",
  "consumptionLastYearKg",
  "consumptionLast3MonthsKg",
  "consumptionLastMonthKg",
  "consumptionLastYear",
  "consumptionLast3Months",
  "consumptionLastMonth",
  "stock",
  "stockKg",
  "stockUnit",
  "onOrderKg",
  "onOrder",
  "dateOfArrival",
  "purchasePrice",
  "purchasePriceUnit",
  "salesPrice",
  "salesPriceUnit",
  "lastOrderDate",
  "minimumStock",
  "minimumStockKg",
  "minStockMethod",
  "minStockFixedValue",
  "minStockFactor",
  "reservedStock",
]);

/** B13, its 26 in its own order. */
export const ORDER_LINES_STILL_TO_BE_CALLED_COLUMNS = pick([
  "revenueGroupNumber",
  "ourReference",
  "productCode",
  "description",
  "orderLine",
  "order",
  "customerCode",
  "customer",
  "city",
  "reference",
  "earliestCallOff",
  "lastCallOff",
  "lineStatus",
  "deliveryDate",
  "quantity",
  "quantityUnit",
  "lengthMm",
  "widthMm",
  "weightKg",
  "amount",
  "notDelivered",
  "weightToDeliver",
  "amountToDeliver",
  "representative",
  "consignment",
  "revenueGroup",
]);
