import { CustomerRevenueRow } from "@/app/(dashboard)/customer-revenue/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  customerGroupLabel,
  monthLabel,
  salesRepresentativeLabel,
} from "@/lib/helpers";

/**
 * Customer revenue as a sheet.
 *
 * The reference's screen is 75 columns wide and most of them hold nothing.
 * What is carried here is everything of its that is alive:
 *
 * - the three-way revenue split — material, options, surcharges — each with its
 *   profit, which is the same split the revenue-group screen makes into rows;
 * - the CRM counters it maintains: last order, last call, last visit, and the
 *   calls and visits this year;
 * - `Active`, the archive flag, and `Point of attention`, which is the
 *   company's own remark.
 *
 * What is left out, and why:
 *
 * - **Every target and potential** — `Target year revenue`, `Target this year`,
 *   `Target last month`, `Potential annual revenue`, `Potential annual sales`,
 *   `Target annual sales` — is `0` on all 1 724 of its rows. So are
 *   `Visit frequency`, `Call frequency`, `Employees`, `Classification`,
 *   `Latest visit report`, `Competitors (Revenue share)` and the three
 *   `Purchase organization` columns. `Region number` is `0`, the eighth screen
 *   to show it dead, and `Customer group code` is `0` on 1 723 rows.
 * - **The ten `… last year` columns** are `0` on every row, correctly: the
 *   first invoice in that database is 7-1-2025, so there is no year to compare
 *   with.
 * - **The ten `… last month` columns** are `0` on every row and the data does
 *   not explain it — April 2025 holds 2 116 324.53 of revenue that should have
 *   appeared. Either the column means something other than the month before, or
 *   it is broken. Copying a column nobody can explain would be copying a bug.
 * - `Trend` compares with last year, so it is `0` for the same reason.
 */

export type CustomerRevenueColumnKey =
  | "customerCode"
  | "customerName"
  | "city"
  | "country"
  | "region"
  | "representative"
  | "accountManager"
  | "customerGroup"
  | "active"
  | "year"
  | "month"
  | "materialRevenue"
  | "optionsRevenue"
  | "surchargesRevenue"
  | "revenue"
  | "materialProfit"
  | "optionsProfit"
  | "surchargesProfit"
  | "profit"
  | "profitMargin"
  | "weightKg"
  | "invoices"
  | "invoiceLines"
  | "lastOrderDate"
  | "lastCallDate"
  | "lastVisitDate"
  | "calledThisYear"
  | "visitsThisYear"
  | "pointOfAttention";

export const CUSTOMER_REVENUE_COLUMNS: Array<
  ExportColumn<CustomerRevenueRow, CustomerRevenueColumnKey>
> = [
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => numberCell(row.customerCode),
  },
  {
    key: "customerName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "accountManager",
    label: "Account manager",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.accountManager)),
  },
  {
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: true,
    value: (row) => textCell(customerGroupLabel(row.customerGroup)),
  },
  {
    key: "active",
    label: "Active",
    defaultVisible: true,
    value: (row) => yesNoCell(row.active),
  },
  {
    key: "year",
    label: "Year",
    defaultVisible: true,
    value: (row) => numberCell(row.year),
  },
  {
    key: "month",
    label: "Month",
    defaultVisible: true,
    value: (row) => textCell(monthLabel(row.month)),
  },
  {
    key: "materialRevenue",
    label: "Revenue of material",
    defaultVisible: true,
    value: (row) => numberCell(row.materialRevenue),
  },
  {
    key: "optionsRevenue",
    label: "Revenue options",
    defaultVisible: true,
    value: (row) => numberCell(row.optionsRevenue),
  },
  {
    key: "surchargesRevenue",
    label: "Revenue surcharges",
    defaultVisible: true,
    value: (row) => numberCell(row.surchargesRevenue),
  },
  {
    key: "revenue",
    label: "Revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.revenue),
  },
  {
    key: "materialProfit",
    label: "Profit of material",
    defaultVisible: true,
    value: (row) => numberCell(row.materialProfit),
  },
  {
    key: "optionsProfit",
    label: "Profit options",
    defaultVisible: true,
    value: (row) => numberCell(row.optionsProfit),
  },
  {
    key: "surchargesProfit",
    label: "Profit surcharges",
    defaultVisible: true,
    value: (row) => numberCell(row.surchargesProfit),
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
    // Whole kilos, the way the reference prints them.
    key: "weightKg",
    label: "Kg.",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "invoices",
    label: "#Invoices",
    defaultVisible: true,
    value: (row) => numberCell(row.invoices),
  },
  {
    // Order lines only: the reference does not count surcharge lines here.
    key: "invoiceLines",
    label: "#Invoice lines",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceLines),
  },
  {
    key: "lastOrderDate",
    label: "Last order date",
    defaultVisible: true,
    value: (row) => dateCell(row.lastOrderDate),
  },
  {
    key: "lastCallDate",
    label: "Last call date",
    defaultVisible: true,
    value: (row) => dateCell(row.lastCallDate),
  },
  {
    key: "lastVisitDate",
    label: "Last visit date",
    defaultVisible: true,
    value: (row) => dateCell(row.lastVisitDate),
  },
  {
    key: "calledThisYear",
    label: "Called this year",
    defaultVisible: true,
    value: (row) => numberCell(row.calledThisYear),
  },
  {
    key: "visitsThisYear",
    label: "Visits this year",
    defaultVisible: true,
    value: (row) => numberCell(row.visitsThisYear),
  },
  {
    key: "pointOfAttention",
    label: "Point of attention",
    defaultVisible: false,
    value: (row) => textCell(row.pointOfAttention),
  },
];
