import { CustomerRevenueSalesVisitsRow } from "@/app/(dashboard)/customer-revenue-sales-and-visits/actions";
import { ExportColumn, numberCell, textCell } from "@/lib/excel";
import { salesRepresentativeLabel } from "@/lib/helpers";

/**
 * Customer revenue, sales and visits as a sheet, in the reference's column
 * order.
 *
 * All twenty-one are carried. `Region number` is `0` on all 809 rows — the
 * ninth screen to show it dead — and prints blank; `Competitors (Revenue
 * share)` is empty on all of them there and reads the customer's own
 * competitors here.
 *
 * The customer is keyed by `Company code` here and by `Debtor number` on the
 * revenue-group screens. They are different numbers for the same company.
 */

export type CustomerRevenueSalesVisitsColumnKey =
  | "representative"
  | "companyCode"
  | "companyName"
  | "visitPostalCode"
  | "visitCity"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "currentYear"
  | "revenueCurrentYear"
  | "revenueLastYear"
  | "revenueTwoYearsAgo"
  | "kgCurrentYear"
  | "kgLastYear"
  | "kgTwoYearsAgo"
  | "targetVisitsPerYear"
  | "visitsCurrentYear"
  | "visitsLastYear"
  | "visitsTwoYearsAgo"
  | "region"
  | "regionNumber"
  | "competitors";

export const CUSTOMER_REVENUE_SALES_VISITS_COLUMNS: Array<
  ExportColumn<
    CustomerRevenueSalesVisitsRow,
    CustomerRevenueSalesVisitsColumnKey
  >
> = [
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "visitPostalCode",
    label: "Visit-Postal code",
    defaultVisible: true,
    value: (row) => textCell(row.visitPostalCode),
  },
  {
    key: "visitCity",
    label: "Visit-City",
    defaultVisible: true,
    value: (row) => textCell(row.visitCity),
  },
  {
    key: "revenueGroupNumber",
    label: "Revenue group number",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueGroupNumber),
  },
  {
    key: "revenueGroupName",
    label: "Revenue group",
    defaultVisible: true,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    key: "currentYear",
    label: "Current year",
    defaultVisible: true,
    value: (row) => numberCell(row.currentYear),
  },
  {
    key: "revenueCurrentYear",
    label: "Revenue current year",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueCurrentYear),
  },
  {
    key: "revenueLastYear",
    label: "Revenue last year",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueLastYear),
  },
  {
    key: "revenueTwoYearsAgo",
    label: "Revenue 2 years ago",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueTwoYearsAgo),
  },
  {
    key: "kgCurrentYear",
    label: "Kg. current year",
    defaultVisible: true,
    value: (row) => numberCell(row.kgCurrentYear),
  },
  {
    key: "kgLastYear",
    label: "Kg. last year",
    defaultVisible: true,
    value: (row) => numberCell(row.kgLastYear),
  },
  {
    key: "kgTwoYearsAgo",
    label: "Kg. 2 years ago",
    defaultVisible: true,
    value: (row) => numberCell(row.kgTwoYearsAgo),
  },
  {
    key: "targetVisitsPerYear",
    label: "Target #visits / year",
    defaultVisible: true,
    value: (row) => numberCell(row.targetVisitsPerYear),
  },
  {
    key: "visitsCurrentYear",
    label: "#Visits current year",
    defaultVisible: true,
    value: (row) => numberCell(row.visitsCurrentYear),
  },
  {
    key: "visitsLastYear",
    label: "#Visits last year",
    defaultVisible: true,
    value: (row) => numberCell(row.visitsLastYear),
  },
  {
    key: "visitsTwoYearsAgo",
    label: "#Visits 2 years ago",
    defaultVisible: true,
    value: (row) => numberCell(row.visitsTwoYearsAgo),
  },
  {
    key: "regionNumber",
    label: "Region number",
    defaultVisible: false,
    // `0` on every reference row, and nothing here numbers a region.
    value: () => null,
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
  {
    key: "competitors",
    label: "Competitors (Revenue share)",
    defaultVisible: false,
    value: (row) => textCell(row.competitors),
  },
];
