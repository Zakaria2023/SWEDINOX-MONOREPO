import { StockOnAdviceRow } from "@/app/(dashboard)/stockon-advice/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { LEAD_TIME_METHOD_LABELS } from "@/lib/labels";

/**
 * StockOn advice as a sheet — see app/(dashboard)/orders/columns.ts.
 *
 * The order is the reference system's own, so that somebody reading both
 * screens side by side finds the same figure in the same place. Which unit each
 * one is counted in is carried in the heading rather than left to be guessed:
 * "(Pur.U.)" is the unit the product is bought by, "(Kg. or Psc.)" the unit it
 * is stocked by, and everything unmarked is in stock units.
 */

export type StockOnAdviceColumnKey =
  | "mainGroup"
  | "productGroup"
  | "productCode"
  | "productName"
  | "technicalStock"
  | "reserved"
  | "stockUnit"
  | "orderLevelStockUnit"
  | "toOrderStockUnit"
  | "toOrder"
  | "orderLevel"
  | "availableStock"
  | "technicalPlusToReceive"
  | "stockMinusOrderLevel"
  | "purchaseUnit"
  | "pctDifference"
  | "orderNow"
  | "determinedByStockOp"
  | "supplierName"
  | "toBeReceivedLongTerm"
  | "toBeReceivedShortTerm"
  | "reviewPeriodDays"
  | "leadTimeDays"
  | "leadTimeMethod"
  | "evaluateToday"
  | "avgConsumptionPerDay"
  | "avgConsumptionDuringLR"
  | "daysOfStock"
  | "firstPurchaseOrderId"
  | "firstReceiptDate"
  | "workingDaysUntilFirstReceipt"
  | "pacClassification"
  | "orderAdviceCode";

export const STOCKON_ADVICE_COLUMNS: Array<
  ExportColumn<StockOnAdviceRow, StockOnAdviceColumnKey>
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
    defaultVisible: false,
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
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "technicalStock",
    label: "Techn. Stk.",
    defaultVisible: true,
    value: (row) => numberCell(row.technicalStock),
  },
  {
    key: "reserved",
    label: "Reserved",
    defaultVisible: true,
    value: (row) => numberCell(row.reserved),
  },
  {
    key: "stockUnit",
    label: "Stock U.",
    defaultVisible: false,
    value: (row) => textCell(row.stockUnit),
  },
  {
    key: "orderLevelStockUnit",
    label: "Order Level (Kg. or Psc.)",
    defaultVisible: false,
    value: (row) => numberCell(row.orderLevelStockUnit),
  },
  {
    key: "toOrderStockUnit",
    label: "To order (Kg. or Psc.)",
    defaultVisible: false,
    value: (row) => numberCell(row.toOrderStockUnit),
  },
  {
    key: "toOrder",
    label: "To order",
    defaultVisible: true,
    value: (row) => numberCell(row.toOrder),
  },
  {
    key: "orderLevel",
    label: "Order Level",
    defaultVisible: true,
    value: (row) => numberCell(row.orderLevel),
  },
  {
    key: "availableStock",
    label: "Available Stk.",
    defaultVisible: true,
    value: (row) => numberCell(row.availableStock),
  },
  {
    key: "technicalPlusToReceive",
    label: "Techn. Stk. + To receive",
    defaultVisible: false,
    value: (row) => numberCell(row.technicalPlusToReceive),
  },
  {
    key: "stockMinusOrderLevel",
    label: "Stock - Order level",
    defaultVisible: true,
    value: (row) => numberCell(row.stockMinusOrderLevel),
  },
  {
    key: "purchaseUnit",
    label: "Purchase U.",
    defaultVisible: false,
    value: (row) => textCell(row.purchaseUnit),
  },
  {
    key: "pctDifference",
    label: "% Difference",
    defaultVisible: true,
    value: (row) => numberCell(row.pctDifference),
  },
  {
    key: "orderNow",
    label: "Order now?",
    defaultVisible: true,
    value: (row) => yesNoCell(row.orderNow),
  },
  {
    key: "determinedByStockOp",
    label: "Determined by StockOp",
    defaultVisible: false,
    value: (row) => yesNoCell(row.determinedByStockOp),
  },
  {
    key: "supplierName",
    label: "Preferred supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "toBeReceivedLongTerm",
    label: "To be received long term (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.toBeReceivedLongTerm),
  },
  {
    key: "toBeReceivedShortTerm",
    label: "To be received short term (Pur.U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.toBeReceivedShortTerm),
  },
  {
    key: "reviewPeriodDays",
    label: "Review time (days)",
    defaultVisible: false,
    value: (row) => numberCell(row.reviewPeriodDays),
  },
  {
    key: "leadTimeDays",
    label: "Lead time (days)",
    defaultVisible: true,
    value: (row) => numberCell(row.leadTimeDays),
  },
  {
    key: "leadTimeMethod",
    label: "Lead time method",
    defaultVisible: false,
    value: (row) => textCell(LEAD_TIME_METHOD_LABELS[row.leadTimeMethod]),
  },
  {
    key: "evaluateToday",
    label: "Evaluate/decide today?",
    defaultVisible: false,
    value: (row) => yesNoCell(row.evaluateToday),
  },
  {
    key: "avgConsumptionPerDay",
    label: "Avg. Consumption/day",
    defaultVisible: false,
    value: (row) => numberCell(row.avgConsumptionPerDay),
  },
  {
    key: "avgConsumptionDuringLR",
    label: "Avg. Consumption during L + R",
    defaultVisible: false,
    value: (row) => numberCell(row.avgConsumptionDuringLR),
  },
  {
    key: "daysOfStock",
    label: "Number of days stk.",
    defaultVisible: true,
    value: (row) => numberCell(row.daysOfStock),
  },
  {
    key: "firstPurchaseOrderId",
    label: "1st current PO",
    defaultVisible: false,
    value: (row) => numberCell(row.firstPurchaseOrderId),
  },
  {
    key: "firstReceiptDate",
    label: "1st PO reception",
    defaultVisible: false,
    value: (row) => dateCell(row.firstReceiptDate),
  },
  {
    key: "workingDaysUntilFirstReceipt",
    label: "Working days until 1st receipt",
    defaultVisible: false,
    value: (row) => numberCell(row.workingDaysUntilFirstReceipt),
  },
  {
    key: "pacClassification",
    label: "PAC classification",
    defaultVisible: false,
    value: (row) => textCell(row.pacClassification),
  },
  {
    key: "orderAdviceCode",
    label: "Order advice code",
    defaultVisible: false,
    value: (row) => textCell(row.orderAdviceCode),
  },
];
