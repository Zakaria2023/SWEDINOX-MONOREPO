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
 * Six of its twenty-six are not carried:
 *
 * - `Region number` is `0` on every row — the sixth screen to show it dead.
 * - `Profit w.r.t. replacement price`, its margin, and `Target annual revenue`
 *   are `0` on all 1 720 rows; `Competitors (Revenue share)` is empty on all
 *   of them.
 * - `Affiliate` reads `HEGO TEST Stainless Steel & Aluminium` on every row —
 *   one constant, and the name is itself the warning that the database those
 *   exports came from is a test copy.
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
  | "invoiceLines";

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
];
