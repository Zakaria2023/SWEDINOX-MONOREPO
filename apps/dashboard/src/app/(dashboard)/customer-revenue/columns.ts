import type {
  CustomerRevenueFigures,
  CustomerRevenueRow,
} from "@/app/(dashboard)/customer-revenue/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { customerGroupLabel, salesRepresentativeLabel } from "@/lib/helpers";
import { COMPANY_CLASSIFICATION_LABELS } from "@/lib/labels";

/**
 * Customer revenue — all 75 columns of the reference's C8 (1 724 rows,
 * docs/reference-system/customers-and-prospects.md Part 10), in its order.
 * One row per customer for one `Year` / `Month`.
 *
 * Three periods sit side by side, each split into material, options and
 * surcharges:
 *
 * - **`… this year`** is the selected month only — proved on May 2025, exact on
 *   90 of 90 customers.
 * - **`… last year`** is the same month a year earlier. `0` on every reference
 *   row, correctly: that database starts on 7-1-2025.
 * - **`… last month`** is the month before. `0` on every reference row too,
 *   which the data does not explain (April 2025 holds 2 116 324.53) — its
 *   statistics are batch-built and the batch had stopped. Ours is computed
 *   from the invoices, so it shows the real figure.
 *
 * Reasoned rather than captured, because the reference holds nothing in them:
 * `Trend` (the change against the same month last year), `Target this year`
 * and `Target last month` (a twelfth of the annual target), `Latest visit
 * report` (the newest report's text) and `Competitors (Revenue share)` (each
 * firm with its share). `Region number` and `Customer group code` are `0` on
 * every reference row and have no source here; they print blank.
 */

export type CustomerRevenueColumnKey =
  | "representative"
  | "customerGroupCode"
  | "customerGroup"
  | "customerCode"
  | "customerName"
  | "city"
  | "country"
  | "revenueLastYear"
  | "kgLastYear"
  | "profitLastYear"
  | "marginLastYear"
  | "invoices"
  | "kgThisYear"
  | "profitThisYear"
  | "marginThisYear"
  | "trend"
  | "revenueLastMonth"
  | "kgLastMonth"
  | "profitLastMonth"
  | "marginLastMonth"
  | "targetYearRevenue"
  | "classification"
  | "visitsThisYear"
  | "targetThisYear"
  | "targetLastMonth"
  | "purchaseOrgCode"
  | "purchaseOrgName"
  | "memberNumberPurchaseOrg"
  | "year"
  | "potentialAnnualRevenue"
  | "accountManager"
  | "regionNumber"
  | "region"
  | "materialRevenueLastYear"
  | "optionsRevenueLastYear"
  | "surchargesRevenueLastYear"
  | "materialProfitLastYear"
  | "optionsProfitLastYear"
  | "surchargesProfitLastYear"
  | "materialMarginLastYear"
  | "optionsMarginLastYear"
  | "surchargesMarginLastYear"
  | "materialRevenueThisYear"
  | "optionsRevenueThisYear"
  | "surchargesRevenueThisYear"
  | "materialProfitThisYear"
  | "optionsProfitThisYear"
  | "surchargesProfitThisYear"
  | "materialMarginThisYear"
  | "optionsMarginThisYear"
  | "surchargesMarginThisYear"
  | "materialRevenueLastMonth"
  | "optionsRevenueLastMonth"
  | "surchargesRevenueLastMonth"
  | "materialProfitLastMonth"
  | "optionsProfitLastMonth"
  | "surchargesProfitLastMonth"
  | "materialMarginLastMonth"
  | "optionsMarginLastMonth"
  | "surchargesMarginLastMonth"
  | "lastOrderDate"
  | "lastCallDate"
  | "lastVisitDate"
  | "latestVisitReport"
  | "pointOfAttention"
  | "visitFrequency"
  | "calledThisYear"
  | "callFrequency"
  | "employees"
  | "active"
  | "competitors"
  | "targetAnnualSales"
  | "potentialAnnualSales"
  | "invoiceLines"
  | "revenueThisYear";

type Column = ExportColumn<CustomerRevenueRow, CustomerRevenueColumnKey>;

type Figure = keyof CustomerRevenueFigures;

const column = (
  key: CustomerRevenueColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: CustomerRevenueRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const thisPeriod = (
  key: CustomerRevenueColumnKey,
  label: string,
  figure: Figure,
  defaultVisible = true,
): Column =>
  column(key, label, defaultVisible, (row) =>
    numberCell(row.thisPeriod[figure]),
  );

const lastYear = (
  key: CustomerRevenueColumnKey,
  label: string,
  figure: Figure,
): Column =>
  column(key, label, false, (row) => numberCell(row.lastYear[figure]));

const lastMonth = (
  key: CustomerRevenueColumnKey,
  label: string,
  figure: Figure,
): Column =>
  column(key, label, false, (row) => numberCell(row.lastMonth[figure]));

const monthlyShare = (annual: string | null): ExportCellValue =>
  annual === null ? null : numberCell(Number(annual) / 12);

export const CUSTOMER_REVENUE_COLUMNS: Column[] = [
  column("representative", "Representative", true, (row) =>
    textCell(salesRepresentativeLabel(row.representative)),
  ),
  column("customerGroupCode", "Customer group code", false, () => null),
  column("customerGroup", "Customer group", true, (row) =>
    textCell(customerGroupLabel(row.customerGroup)),
  ),
  column("customerCode", "Customer code", true, (row) =>
    numberCell(row.customerCode),
  ),
  column("customerName", "Customer", true, (row) => textCell(row.customerName)),
  column("city", "City", true, (row) => textCell(row.city)),
  column("country", "Country", true, (row) => textCell(row.country)),
  lastYear("revenueLastYear", "Revenue last year", "revenue"),
  lastYear("kgLastYear", "Kg. previous year", "weightKg"),
  lastYear("profitLastYear", "Profit last year", "profit"),
  lastYear("marginLastYear", "Profit margin last year", "profitMargin"),
  thisPeriod("invoices", "#Invoices (selection period)", "invoices"),
  thisPeriod("kgThisYear", "Kg. this year", "weightKg"),
  thisPeriod("profitThisYear", "Profit this year", "profit"),
  thisPeriod("marginThisYear", "Profit margin this year", "profitMargin"),
  column("trend", "Trend", false, (row) => numberCell(row.trend)),
  lastMonth("revenueLastMonth", "Revenue last month", "revenue"),
  lastMonth("kgLastMonth", "Kg. last month", "weightKg"),
  lastMonth("profitLastMonth", "Profit last month", "profit"),
  lastMonth("marginLastMonth", "Profit margin last month", "profitMargin"),
  column("targetYearRevenue", "Target year revenue", false, (row) =>
    numberCell(row.targetAnnualRevenue),
  ),
  column("classification", "Classification", false, (row) =>
    row.classification
      ? COMPANY_CLASSIFICATION_LABELS[row.classification]
      : null,
  ),
  column("visitsThisYear", "Visits this year", true, (row) =>
    numberCell(row.visitsThisYear),
  ),
  column("targetThisYear", "Target this year", false, (row) =>
    monthlyShare(row.targetAnnualRevenue),
  ),
  column("targetLastMonth", "Target last month", false, (row) =>
    monthlyShare(row.targetAnnualRevenue),
  ),
  column("purchaseOrgCode", "Purchase organization code", false, (row) =>
    numberCell(row.purchaseOrgCode),
  ),
  column("purchaseOrgName", "Purchase organization name", false, (row) =>
    textCell(row.purchaseOrgName),
  ),
  column(
    "memberNumberPurchaseOrg",
    "Mem. no. Purchase organization",
    false,
    (row) => textCell(row.memberNumberPurchaseOrg),
  ),
  column("year", "This year", true, (row) => numberCell(row.year)),
  column("potentialAnnualRevenue", "Potential annual revenue", false, (row) =>
    numberCell(row.potentialAnnualRevenue),
  ),
  column("accountManager", "Account manager", true, (row) =>
    textCell(salesRepresentativeLabel(row.accountManager)),
  ),
  column("regionNumber", "Region number", false, () => null),
  column("region", "Region", true, (row) => textCell(row.region)),
  lastYear(
    "materialRevenueLastYear",
    "Revenue of material last year",
    "materialRevenue",
  ),
  lastYear("optionsRevenueLastYear", "Revenue options last year", "optionsRevenue"),
  lastYear(
    "surchargesRevenueLastYear",
    "Revenue surcharges last year",
    "surchargesRevenue",
  ),
  lastYear("materialProfitLastYear", "Profit material last year", "materialProfit"),
  lastYear("optionsProfitLastYear", "Profit options last year", "optionsProfit"),
  lastYear(
    "surchargesProfitLastYear",
    "Profit surcharges last year",
    "surchargesProfit",
  ),
  lastYear(
    "materialMarginLastYear",
    "Profit margin material last year",
    "materialMargin",
  ),
  lastYear(
    "optionsMarginLastYear",
    "Profit margin options last year",
    "optionsMargin",
  ),
  lastYear(
    "surchargesMarginLastYear",
    "Profit margin for surcharges last year",
    "surchargesMargin",
  ),
  thisPeriod(
    "materialRevenueThisYear",
    "Revenue of material this year",
    "materialRevenue",
  ),
  thisPeriod(
    "optionsRevenueThisYear",
    "Revenue options this year",
    "optionsRevenue",
  ),
  thisPeriod(
    "surchargesRevenueThisYear",
    "Revenue surcharges this year",
    "surchargesRevenue",
  ),
  thisPeriod(
    "materialProfitThisYear",
    "Profit material this year",
    "materialProfit",
  ),
  thisPeriod(
    "optionsProfitThisYear",
    "Profit options this year",
    "optionsProfit",
    false,
  ),
  thisPeriod(
    "surchargesProfitThisYear",
    "Profit surcharges this year",
    "surchargesProfit",
  ),
  thisPeriod(
    "materialMarginThisYear",
    "Profit margin material this year",
    "materialMargin",
  ),
  thisPeriod(
    "optionsMarginThisYear",
    "Profit margin options this year",
    "optionsMargin",
    false,
  ),
  // `Profit margin for allowances this year` there — a translation slip: it
  // is profit ÷ revenue of surcharges, 30 of 30.
  thisPeriod(
    "surchargesMarginThisYear",
    "Profit margin for surcharges this year",
    "surchargesMargin",
  ),
  lastMonth(
    "materialRevenueLastMonth",
    "Revenue of material last month",
    "materialRevenue",
  ),
  lastMonth(
    "optionsRevenueLastMonth",
    "Revenue options last month",
    "optionsRevenue",
  ),
  lastMonth(
    "surchargesRevenueLastMonth",
    "Revenue surcharges last month",
    "surchargesRevenue",
  ),
  lastMonth(
    "materialProfitLastMonth",
    "Profit material last month",
    "materialProfit",
  ),
  lastMonth("optionsProfitLastMonth", "Profit options last month", "optionsProfit"),
  lastMonth(
    "surchargesProfitLastMonth",
    "Profit surcharges last month",
    "surchargesProfit",
  ),
  lastMonth(
    "materialMarginLastMonth",
    "Profit margin material last month",
    "materialMargin",
  ),
  lastMonth(
    "optionsMarginLastMonth",
    "Profit margin options last month",
    "optionsMargin",
  ),
  lastMonth(
    "surchargesMarginLastMonth",
    "Profit margin for surcharges last month",
    "surchargesMargin",
  ),
  column("lastOrderDate", "Last order date", true, (row) =>
    dateCell(row.lastOrderDate),
  ),
  column("lastCallDate", "Last call date", true, (row) =>
    dateCell(row.lastCallDate),
  ),
  column("lastVisitDate", "Last visit date", true, (row) =>
    dateCell(row.lastVisitDate),
  ),
  column("latestVisitReport", "Latest visit report", false, (row) =>
    textCell(row.latestVisitReport),
  ),
  column("pointOfAttention", "Point of attention", false, (row) =>
    textCell(row.pointOfAttention),
  ),
  column("visitFrequency", "Visit frequency", false, (row) =>
    numberCell(row.visitFrequency),
  ),
  column("calledThisYear", "Called this year", true, (row) =>
    numberCell(row.calledThisYear),
  ),
  column("callFrequency", "Call frequency", false, (row) =>
    numberCell(row.callFrequency),
  ),
  column("employees", "Employees", false, (row) => numberCell(row.employees)),
  column("active", "Active", true, (row) => yesNoCell(row.active)),
  column("competitors", "Competitors (Revenue share)", false, (row) =>
    textCell(row.competitors),
  ),
  column("targetAnnualSales", "Target annual sales", false, (row) =>
    numberCell(row.targetAnnualSales),
  ),
  column("potentialAnnualSales", "Potential annual sales", false, (row) =>
    numberCell(row.potentialAnnualSales),
  ),
  thisPeriod("invoiceLines", "#Invoice lines (selection period)", "invoiceLines"),
  thisPeriod("revenueThisYear", "Revenue this year", "revenue"),
];
