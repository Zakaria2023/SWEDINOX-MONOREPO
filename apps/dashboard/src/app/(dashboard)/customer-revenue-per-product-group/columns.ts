import { CustomerRevenuePerProductGroupRow } from "@/app/(dashboard)/customer-revenue-per-product-group/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  customerGroupLabel,
  monthLabel,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";

/**
 * Customer revenue per product group as a sheet, in the reference's column
 * order.
 *
 * All twenty-five are carried. Two print blank and are hidden by default:
 *
 * - `Region number` is `0` on every row — the fifth screen to show it dead.
 * - `Loading address` reads `HEGO` or blank on every row and never names
 *   another warehouse. Nothing in our schema records which depot a line was
 *   loaded at; when loading is modelled, the column gets its source.
 */

export type CustomerRevenuePerProductGroupColumnKey =
  | "representative"
  | "customerGroup"
  | "transportRegion"
  | "debtorNumber"
  | "customerName"
  | "city"
  | "productGroupName"
  | "subgroup1Name"
  | "subgroup2Name"
  | "year"
  | "month"
  | "invoiceDate"
  | "sourceType"
  | "option1"
  | "option2"
  | "salesPriceUnit"
  | "priceUnit"
  | "weightKg"
  | "revenue"
  | "profit"
  | "profitMargin"
  | "invoiceLines"
  | "region"
  | "regionNumber"
  | "loadingAddress";

export const CUSTOMER_REVENUE_PER_PRODUCT_GROUP_COLUMNS: Array<
  ExportColumn<
    CustomerRevenuePerProductGroupRow,
    CustomerRevenuePerProductGroupColumnKey
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
    key: "transportRegion",
    label: "Transport region",
    defaultVisible: true,
    value: (row) => textCell(row.transportRegion),
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
    key: "productGroupName",
    label: "Product group",
    defaultVisible: true,
    value: (row) => textCell(row.productGroupName),
  },
  {
    key: "subgroup1Name",
    label: "Subgroup1",
    defaultVisible: true,
    value: (row) => textCell(row.subgroup1Name),
  },
  {
    key: "subgroup2Name",
    label: "Subgroup2",
    defaultVisible: true,
    value: (row) => textCell(row.subgroup2Name),
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
    key: "invoiceDate",
    label: "Invoice date",
    defaultVisible: true,
    value: (row) => dateCell(row.invoiceDate),
  },
  {
    key: "loadingAddress",
    label: "Loading address",
    defaultVisible: false,
    // `HEGO` or blank on every reference row — never another depot. Nothing
    // here records which depot a line was loaded at, so it prints blank.
    value: () => null,
  },
  {
    key: "sourceType",
    label: "Order type",
    defaultVisible: true,
    value: (row) => textCell(ORDER_SOURCE_TYPE_LABELS[row.sourceType]),
  },
  {
    key: "option1",
    label: "Option 1",
    defaultVisible: true,
    value: (row) => textCell(row.option1),
  },
  {
    key: "option2",
    label: "Option 2",
    defaultVisible: true,
    value: (row) => textCell(row.option2),
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
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "revenue",
    label: "Revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.revenue),
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
    key: "invoiceLines",
    label: "#Invoice lines",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceLines),
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
];
