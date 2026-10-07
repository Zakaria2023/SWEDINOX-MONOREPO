import { OrderAdviceRow } from "@/app/(dashboard)/order-advice/actions";
import { ExportColumn, numberCell, textCell, yesNoCell } from "@/lib/excel";
import { DELIVERY_TIME_UNIT_LABELS } from "@/lib/labels";

/**
 * Order advice as a sheet — see app/(dashboard)/orders/columns.ts.
 *
 * The first eighteen are the saved view the buyers work from, in its own order,
 * and are the only ones on screen at first. Every other column the reference's
 * palette carries follows, grouped as its full view groups them, one click away
 * in the column picker and always in the export.
 */

export type OrderAdviceColumnKey =
  // The saved view
  | "productCode"
  | "description"
  | "mainGroup"
  | "stockPurchaseUnit"
  | "reservedPurchaseUnit"
  | "availableKg"
  | "toBeReceivedShortTermKg"
  | "economicStockKg"
  | "avgMonthlyConsumptionLastYearKg"
  | "supplierName"
  | "consumptionPreviousMonthKg"
  | "avgMonthlyConsumptionLast3YearsKg"
  | "adviceWeightRounded"
  | "economicCoverage"
  | "technicalCoverage"
  | "stockProduct"
  | "adviceQtyPurchaseUnit"
  | "orderQtyPurchaseUnit"
  // Identity and classification
  | "productGroup"
  | "quality"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "pacCode"
  | "orderAdviceCode"
  | "orderAdviceNotes"
  // Conversion factors and units
  | "theoreticalWeight"
  | "purchaseUnit"
  | "replacementPriceUnit"
  // Supplier terms
  | "supplierCode"
  | "supplierProductNo"
  | "deliveryTime"
  | "deliveryTimeUnit"
  | "minOrderQty"
  | "minOrderQtyUnit"
  | "orderSeries"
  | "orderSeriesUnit"
  // The stocking policy
  | "minStock"
  | "maxStock"
  | "minStockMethod"
  | "minStockFixedValue"
  | "minStockFactor"
  | "maxStockMethod"
  | "maxStockFixedValue"
  | "maxStockFactor"
  // The position, in the purchase unit
  | "availablePurchaseUnit"
  | "notReservedCallOff"
  | "notReservedOther"
  | "notCoveredOther"
  | "blockedPurchaseUnit"
  | "economicStockPurchaseUnit"
  | "consignment"
  | "consignmentKg"
  // Incoming
  | "toBeReceivedShortTermPurchaseUnit"
  | "toBeReceivedLongTermKg"
  | "toBeReceivedLongTermPurchaseUnit"
  // Demand
  | "consumptionPreviousMonth"
  | "consumptionLast3Months"
  | "consumptionLast3MonthsKg"
  | "consumptionLastYear"
  | "consumptionLastYearKg"
  | "avgMonthlyConsumptionLast3Months"
  | "avgMonthlyConsumptionPreviousYear"
  | "avgMonthlyConsumptionLast2Years"
  | "avgMonthlyConsumptionLast2YearsKg"
  | "avgMonthlyConsumptionLast3Years"
  | "consumptionTrend"
  // Advice and money
  | "adviceQtyRounded"
  | "replacementPrice"
  | "amount"
  | "turnoverRate"
  | "avgMonthlyConsumptionLastYear"
  | "avgMonthlyConsumptionPreviousYearKg";

export const ORDER_ADVICE_COLUMNS: Array<
  ExportColumn<OrderAdviceRow, OrderAdviceColumnKey>
> = [
  // ── The saved view ─────────────────────────────────────────────────────
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
    key: "mainGroup",
    label: "Main group",
    defaultVisible: true,
    value: (row) => textCell(row.mainGroup),
  },
  {
    key: "stockPurchaseUnit",
    label: "Stock (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.stockPurchaseUnit),
  },
  {
    key: "reservedPurchaseUnit",
    label: "Reserved (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.reservedPurchaseUnit),
  },
  {
    key: "availableKg",
    label: "Available (Kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.availableKg),
  },
  {
    key: "toBeReceivedShortTermKg",
    label: "To be received short term (Kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.toBeReceivedShortTermKg),
  },
  {
    key: "economicStockKg",
    label: "Econ. stock (Kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.economicStockKg),
  },
  {
    key: "avgMonthlyConsumptionLastYearKg",
    label: "Avg. Monthly consumption last year (Kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.avgMonthlyConsumptionLastYearKg),
  },
  {
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "consumptionPreviousMonthKg",
    label: "Consumption previous month (Kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.consumptionPreviousMonthKg),
  },
  {
    key: "avgMonthlyConsumptionLast3YearsKg",
    label: "Avg. Monthly consumption last 3 years (Kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.avgMonthlyConsumptionLast3YearsKg),
  },
  {
    key: "adviceWeightRounded",
    label: "Advice Weight rounded",
    defaultVisible: true,
    value: (row) => numberCell(row.adviceWeightRounded),
  },
  {
    key: "economicCoverage",
    label: "Economic Coverage",
    defaultVisible: true,
    value: (row) => numberCell(row.economicCoverage),
  },
  {
    key: "technicalCoverage",
    label: "Technical Coverage",
    defaultVisible: true,
    value: (row) => numberCell(row.technicalCoverage),
  },
  {
    key: "stockProduct",
    label: "Stock product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.stockProduct),
  },
  {
    key: "adviceQtyPurchaseUnit",
    label: "Advice Qty. (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.adviceQtyPurchaseUnit),
  },
  {
    key: "orderQtyPurchaseUnit",
    label: "OrderQty (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.orderQtyPurchaseUnit),
  },

  // ── Identity and classification ────────────────────────────────────────
  {
    key: "productGroup",
    label: "Product group",
    defaultVisible: false,
    value: (row) => textCell(row.productGroup),
  },
  {
    key: "quality",
    label: "Quality",
    defaultVisible: false,
    value: (row) => textCell(row.quality),
  },
  {
    key: "revenueGroupNumber",
    label: "Revenue group number",
    defaultVisible: false,
    value: (row) => numberCell(row.revenueGroupNumber),
  },
  {
    key: "revenueGroupName",
    label: "Revenue group",
    defaultVisible: false,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    key: "pacCode",
    label: "PAC-Code",
    defaultVisible: false,
    value: (row) => textCell(row.pacCode),
  },
  {
    key: "orderAdviceCode",
    label: "Order advice code",
    defaultVisible: false,
    value: (row) => textCell(row.orderAdviceCode),
  },
  {
    key: "orderAdviceNotes",
    label: "Order advice notes",
    defaultVisible: false,
    value: (row) => textCell(row.orderAdviceNotes),
  },

  // ── Conversion factors and units ───────────────────────────────────────
  {
    key: "theoreticalWeight",
    label: "Theoretical Weight/Pcs.",
    defaultVisible: false,
    value: (row) => numberCell(row.theoreticalWeight),
  },
  {
    key: "purchaseUnit",
    label: "Purchase U.",
    defaultVisible: false,
    value: (row) => textCell(row.purchaseUnit),
  },
  {
    key: "replacementPriceUnit",
    label: "U(replacement price)",
    defaultVisible: false,
    value: (row) => textCell(row.replacementPriceUnit),
  },

  // ── Supplier terms ─────────────────────────────────────────────────────
  {
    key: "supplierCode",
    label: "Supplier code",
    defaultVisible: false,
    value: (row) => textCell(row.supplierCode),
  },
  {
    key: "supplierProductNo",
    label: "Product no. sup.",
    defaultVisible: false,
    value: (row) => textCell(row.supplierProductNo),
  },
  {
    key: "deliveryTime",
    label: "Deliver time",
    defaultVisible: false,
    value: (row) => numberCell(row.deliveryTime),
  },
  {
    key: "deliveryTimeUnit",
    label: "U.(delivery time)",
    defaultVisible: false,
    value: (row) =>
      textCell(
        row.deliveryTimeUnit
          ? DELIVERY_TIME_UNIT_LABELS[row.deliveryTimeUnit]
          : null,
      ),
  },
  {
    key: "minOrderQty",
    label: "Min. OrderQty.",
    defaultVisible: false,
    value: (row) => numberCell(row.minOrderQty),
  },
  {
    key: "minOrderQtyUnit",
    label: "U.(Moq.)",
    defaultVisible: false,
    value: (row) => textCell(row.minOrderQtyUnit),
  },
  {
    key: "orderSeries",
    label: "Order series",
    defaultVisible: false,
    value: (row) => numberCell(row.orderSeries),
  },
  {
    key: "orderSeriesUnit",
    label: "U(order series)",
    defaultVisible: false,
    value: (row) => textCell(row.orderSeriesUnit),
  },

  // ── The stocking policy ────────────────────────────────────────────────
  {
    key: "minStock",
    label: "Min. Stock (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.minStock),
  },
  {
    key: "maxStock",
    label: "Max. Stock (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.maxStock),
  },
  {
    key: "minStockMethod",
    label: "Min. Stk. Method (Pur.U.)",
    defaultVisible: false,
    value: (row) => textCell(row.minStockMethod),
  },
  {
    key: "minStockFixedValue",
    label: "Min. Stk. Fixed value (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.minStockFixedValue),
  },
  {
    key: "minStockFactor",
    label: "Min. Stk. Factor Avg.Mon.Cons.",
    defaultVisible: false,
    value: (row) => numberCell(row.minStockFactor),
  },
  {
    key: "maxStockMethod",
    label: "Max. Stock Method (Pur.U.)",
    defaultVisible: false,
    value: (row) => textCell(row.maxStockMethod),
  },
  {
    key: "maxStockFixedValue",
    label: "Max. Stock Fixed value (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.maxStockFixedValue),
  },
  {
    key: "maxStockFactor",
    label: "Max. Stock Factor Avg.Month.Consumption",
    defaultVisible: false,
    value: (row) => numberCell(row.maxStockFactor),
  },

  // ── The position, in the purchase unit ─────────────────────────────────
  {
    key: "availablePurchaseUnit",
    label: "Available (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.availablePurchaseUnit),
  },
  {
    key: "notReservedCallOff",
    label: "Not reserved call-off (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.notReservedCallOff),
  },
  {
    key: "notReservedOther",
    label: "Not reserved other (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.notReservedOther),
  },
  {
    key: "notCoveredOther",
    label: "Not covered other (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.notCoveredOther),
  },
  {
    key: "blockedPurchaseUnit",
    label: "Blocked (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.blockedPurchaseUnit),
  },
  {
    key: "economicStockPurchaseUnit",
    label: "Econ. stock (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.economicStockPurchaseUnit),
  },
  {
    key: "consignment",
    label: "Consign.",
    defaultVisible: false,
    value: (row) => numberCell(row.consignment),
  },
  {
    key: "consignmentKg",
    label: "Consign.KG",
    defaultVisible: false,
    value: (row) => numberCell(row.consignmentKg),
  },

  // ── Incoming ───────────────────────────────────────────────────────────
  {
    key: "toBeReceivedShortTermPurchaseUnit",
    label: "To be received short term (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.toBeReceivedShortTermPurchaseUnit),
  },
  {
    key: "toBeReceivedLongTermKg",
    label: "To be received long term (Kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.toBeReceivedLongTermKg),
  },
  {
    key: "toBeReceivedLongTermPurchaseUnit",
    label: "To be received long term (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.toBeReceivedLongTermPurchaseUnit),
  },

  // ── Demand ─────────────────────────────────────────────────────────────
  {
    key: "consumptionPreviousMonth",
    label: "Consumption previous month",
    defaultVisible: false,
    value: (row) => numberCell(row.consumptionPreviousMonth),
  },
  {
    key: "consumptionLast3Months",
    label: "Consumption last 3 months (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.consumptionLast3Months),
  },
  {
    key: "consumptionLast3MonthsKg",
    label: "Consumption last 3 months (Kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.consumptionLast3MonthsKg),
  },
  {
    key: "consumptionLastYear",
    label: "Consumption last year (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.consumptionLastYear),
  },
  {
    key: "consumptionLastYearKg",
    label: "Consumption last year (Kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.consumptionLastYearKg),
  },
  {
    key: "avgMonthlyConsumptionLast3Months",
    label: "Avg. Monthly consumption last 3 months (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.avgMonthlyConsumptionLast3Months),
  },
  {
    key: "avgMonthlyConsumptionLastYear",
    label: "Avg. Monthly consumption last year (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.avgMonthlyConsumptionLastYear),
  },
  {
    key: "avgMonthlyConsumptionPreviousYear",
    label: "Avg. Monthly consumption previous year",
    defaultVisible: false,
    value: (row) => numberCell(row.avgMonthlyConsumptionPreviousYear),
  },
  {
    key: "avgMonthlyConsumptionPreviousYearKg",
    label: "Avg. Monthly consumption previous year (Kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.avgMonthlyConsumptionPreviousYearKg),
  },
  {
    key: "avgMonthlyConsumptionLast2Years",
    label: "Avg. Monthly consumption last 2 years",
    defaultVisible: false,
    value: (row) => numberCell(row.avgMonthlyConsumptionLast2Years),
  },
  {
    key: "avgMonthlyConsumptionLast2YearsKg",
    label: "Avg. Monthly consumption last 2 years (Kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.avgMonthlyConsumptionLast2YearsKg),
  },
  {
    key: "avgMonthlyConsumptionLast3Years",
    label: "Avg. Monthly consumption last 3 years",
    defaultVisible: false,
    value: (row) => numberCell(row.avgMonthlyConsumptionLast3Years),
  },
  {
    key: "consumptionTrend",
    label: "Avg. Monthly consumption 3 w.r.t. 1 year (%)",
    defaultVisible: false,
    value: (row) => numberCell(row.consumptionTrend),
  },

  // ── Advice and money ───────────────────────────────────────────────────
  {
    key: "adviceQtyRounded",
    label: "Advice Qty. rounded",
    defaultVisible: false,
    value: (row) => numberCell(row.adviceQtyRounded),
  },
  {
    key: "replacementPrice",
    label: "Replacement price",
    defaultVisible: false,
    value: (row) => numberCell(row.replacementPrice),
  },
  {
    key: "amount",
    label: "Amount",
    defaultVisible: false,
    value: (row) => numberCell(row.amount),
  },
  {
    key: "turnoverRate",
    label: "Turnover rate",
    defaultVisible: false,
    value: (row) => numberCell(row.turnoverRate),
  },
];
