import { CustomerRevenuePerRevenueGroupRow } from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import { ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  customerGroupLabel,
  monthLabel,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";

/**
 * Customer revenue per revenue group as a sheet, in the reference's column
 * order.
 *
 * Every reference column is carried. Six were empty or constant there and are
 * hidden by default:
 *
 * - `Region number` is `0` on every row and has no source here — blank.
 * - `Profit w.r.t. replacement price` and its margin are `0` on all 1 720 rows;
 *   ours are computed from each line's replacement price.
 * - `Target annual revenue` and `Competitors (Revenue share)` come from the
 *   customer record.
 * - `Affiliate` is the branch's own legal name from the settings — `HEGO TEST
 *   Stainless Steel & Aluminium` on every reference row.
 */

export type CustomerRevenuePerRevenueGroupColumnKey =
  | "representative"
  | "customerGroup"
  | "debtorNumber"
  | "customerName"
  | "city"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "sourceType"
  | "year"
  | "month"
  | "salesPriceUnit"
  | "priceUnit"
  | "profit"
  | "profitMargin"
  | "revenue"
  | "weightKg"
  | "country"
  | "accountManager"
  | "region"
  | "invoiceLines"
  | "regionNumber"
  | "replacementProfit"
  | "replacementMargin"
  | "targetAnnualRevenue"
  | "competitors"
  | "affiliateName";

export const CUSTOMER_REVENUE_PER_REVENUE_GROUP_COLUMNS: Array<
  ExportColumn<
    CustomerRevenuePerRevenueGroupRow,
    CustomerRevenuePerRevenueGroupColumnKey
  >
> = [
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: true,
    value: (row) => textCell(customerGroupLabel(row.customerGroup)),
  },
  {
    key: "debtorNumber",
    label: "Debtor number",
    defaultVisible: true,
    value: (row) => textCell(row.debtorNumber),
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
    // Blank on a charge: the reference gives its charge rows no order type
    // either, because a charge belongs to the invoice, not to a sold line.
    key: "sourceType",
    label: "Order type",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : null,
      ),
  },
  {
    key: "year",
    label: "Year (Invoice date)",
    defaultVisible: true,
    value: (row) => numberCell(row.year),
  },
  {
    key: "month",
    label: "Month (Invoice date)",
    defaultVisible: true,
    value: (row) => textCell(monthLabel(row.month)),
  },
  {
    key: "salesPriceUnit",
    label: "Sales (PriceU)",
    defaultVisible: true,
    value: (row) => numberCell(row.salesPriceUnit),
  },
  {
    key: "priceUnit",
    label: "PriceU",
    defaultVisible: true,
    value: (row) => textCell(row.priceUnit),
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
    key: "revenue",
    label: "Revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.revenue),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
  },
  {
    key: "accountManager",
    label: "Account manager",
    defaultVisible: true,
    value: (row) => textCell(row.accountManager),
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
    key: "invoiceLines",
    label: "#Invoice lines",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceLines),
  },
  {
    key: "replacementProfit",
    label: "Profit w.r.t. replacement price",
    defaultVisible: false,
    value: (row) => numberCell(row.replacementProfit),
  },
  {
    key: "replacementMargin",
    label: "Profit margin w.r.t. replacement price",
    defaultVisible: false,
    value: (row) => numberCell(row.replacementMargin),
  },
  {
    key: "targetAnnualRevenue",
    label: "Target annual revenue",
    defaultVisible: false,
    value: (row) => numberCell(row.targetAnnualRevenue),
  },
  {
    key: "competitors",
    label: "Competitors (Revenue share)",
    defaultVisible: false,
    value: (row) => textCell(row.competitors),
  },
  {
    key: "affiliateName",
    label: "Affiliate",
    defaultVisible: false,
    value: (row) => textCell(row.affiliateName),
  },
];
