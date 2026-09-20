import { InvoiceLineItem } from "@/app/(dashboard)/invoice-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  absoluteProfitMarginPercent,
  customerGroupLabel,
  monthLabel,
  profitMarginPercent,
  representativeInitials,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

/**
 * Invoice lines as a sheet, in the reference's column order.
 *
 * ⚠️ **Three margins, two conventions, on the same row.** `Profit margin
 * products` divides by the *size* of the revenue and rounds to one decimal;
 * `Profit margin line` divides by the *signed* revenue and rounds to two. On a
 * credit note they disagree in sign — invoice 501253 prints +9.03 on the line
 * and a negative figure on the products beside it. Neither is the mistake;
 * the screen genuinely uses both, so neither may be replaced by the other.
 *
 * Three of the reference's forty-three are not carried:
 *
 * - `Region number` is `0` on all 5 650 rows.
 * - `Member SFN` is `False` on all 5 650 — the feature is switched off, and
 *   this is the fourth screen to show it unused.
 * - `Affiliate company details` is one constant on every row.
 */

export type InvoiceLineColumnKey =
  | "revenueGroupNumber"
  | "productCode"
  | "description"
  | "invoiceId"
  | "invoiceDate"
  | "orderId"
  | "lineNumber"
  | "revenueGroupName"
  | "sourceType"
  | "deliveryDate"
  | "customerCode"
  | "customerName"
  | "city"
  | "representativeInitials"
  | "representative"
  | "sellerInitials"
  | "sellerName"
  | "quantity"
  | "unit"
  | "lengthMm"
  | "widthMm"
  | "region"
  | "profitProducts"
  | "profitMarginProducts"
  | "revenueProducts"
  | "revenueOptions"
  | "profitOptions"
  | "profitMarginOptions"
  | "commodityCode"
  | "year"
  | "month"
  | "country"
  | "vatNumber"
  | "weightKg"
  | "debtorNumber"
  | "revenueLine"
  | "profitLine"
  | "profitMarginLine"
  | "customerGroup"
  | "lineType";

const initialsOf = (name: string | null): string | null => {
  if (!name) {
    return null;
  }
  const words = name.split(" ").filter(Boolean);
  if (words.length < 2) {
    return null;
  }
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
};

const round = (value: number, places: number): number =>
  Number(value.toFixed(places));

const invoiceYear = (row: InvoiceLineItem): number | null =>
  row.invoiceDate ? new Date(row.invoiceDate).getFullYear() : null;

const invoiceMonth = (row: InvoiceLineItem): number | null =>
  row.invoiceDate ? new Date(row.invoiceDate).getMonth() + 1 : null;

export const INVOICE_LINE_COLUMNS: Array<
  ExportColumn<InvoiceLineItem, InvoiceLineColumnKey>
> = [
  {
    key: "revenueGroupNumber",
    label: "Revenue group number",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueGroupNumber),
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
    key: "invoiceId",
    label: "Invoice number",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceId),
  },
  {
    key: "invoiceDate",
    label: "Invoice date",
    defaultVisible: true,
    value: (row) => dateCell(row.invoiceDate),
  },
  {
    key: "orderId",
    label: "Order",
    defaultVisible: true,
    value: (row) => numberCell(row.orderId),
  },
  {
    // The reference prints 0 here on a surcharge line, because a surcharge has
    // no order line to name. Ours leaves it empty, which says the same thing
    // without inventing a line number nought.
    key: "lineNumber",
    label: "Order line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "revenueGroupName",
    label: "Revenue group",
    defaultVisible: true,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    // `Order type` on this screen is the line's sourcing, Stk or CD -- not the
    // order's own type. The reference uses one header for both fields.
    key: "sourceType",
    label: "Order type (supply)",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.sourceType === "cross_dock" ? "CD" : row.sourceType ? "Stk" : null,
      ),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
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
    key: "representativeInitials",
    label: "Representative (Initials)",
    defaultVisible: false,
    value: (row) => textCell(representativeInitials(row.representative)),
  },
  {
    key: "representative",
    label: "Representative (Name)",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "sellerInitials",
    label: "Seller (Initials)",
    defaultVisible: false,
    value: (row) => textCell(initialsOf(row.sellerName)),
  },
  {
    key: "sellerName",
    label: "Seller (Name)",
    defaultVisible: true,
    value: (row) => textCell(row.sellerName),
  },
  {
    key: "quantity",
    label: "Quantity (QtyU)",
    defaultVisible: true,
    value: (row) => numberCell(row.quantity),
  },
  {
    // `Euro` on a surcharge line: it is priced as a lump sum, so the money is
    // the quantity.
    key: "unit",
    label: "QtyU",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.lineType === "surcharge"
          ? "Euro"
          : row.unit
            ? (STOCK_UNIT_LABELS[row.unit as keyof typeof STOCK_UNIT_LABELS] ??
              row.unit)
            : null,
      ),
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
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
  {
    key: "profitProducts",
    label: "Profit products",
    defaultVisible: true,
    value: (row) => numberCell(row.profitProducts),
  },
  {
    // Divided by the size of the revenue, one decimal.
    key: "profitMarginProducts",
    label: "Profit margin products",
    defaultVisible: true,
    value: (row) =>
      numberCell(
        round(
          absoluteProfitMarginPercent(row.revenueProducts, row.profitProducts),
          1,
        ),
      ),
  },
  {
    key: "revenueProducts",
    label: "Revenue products",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueProducts),
  },
  {
    key: "revenueOptions",
    label: "Revenue options",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueOptions),
  },
  {
    key: "profitOptions",
    label: "Profit options",
    defaultVisible: true,
    value: (row) => numberCell(row.profitOptions),
  },
  {
    key: "profitMarginOptions",
    label: "Profit margin options",
    defaultVisible: true,
    value: (row) =>
      numberCell(
        round(
          absoluteProfitMarginPercent(row.revenueOptions, row.profitOptions),
          1,
        ),
      ),
  },
  {
    key: "commodityCode",
    label: "CBS no.",
    defaultVisible: false,
    value: (row) => textCell(row.commodityCode),
  },
  {
    key: "year",
    label: "Year (Invoice date)",
    defaultVisible: false,
    value: (row) => numberCell(invoiceYear(row)),
  },
  {
    key: "month",
    label: "Month (Invoice date)",
    defaultVisible: false,
    value: (row) => {
      const month = invoiceMonth(row);
      return textCell(month ? monthLabel(month) : null);
    },
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: false,
    value: (row) => textCell(row.country),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: false,
    value: (row) => textCell(row.vatNumber),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "debtorNumber",
    label: "Debtor no.",
    defaultVisible: false,
    value: (row) => textCell(row.debtorNumber),
  },
  {
    key: "revenueLine",
    label: "Revenue line",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueLine),
  },
  {
    key: "profitLine",
    label: "Profit line",
    defaultVisible: true,
    value: (row) => numberCell(row.profitLine),
  },
  {
    // Divided by the signed revenue, two decimals -- the convention that makes
    // a credit note read positive.
    key: "profitMarginLine",
    label: "Profit margin line",
    defaultVisible: true,
    value: (row) =>
      numberCell(
        round(profitMarginPercent(row.revenueLine, row.profitLine), 2),
      ),
  },
  {
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: false,
    value: (row) => textCell(customerGroupLabel(row.customerGroup)),
  },
  {
    key: "lineType",
    label: "Linetype",
    defaultVisible: true,
    value: (row) =>
      textCell(row.lineType === "surcharge" ? "Surcharge" : "Orderline"),
  },
];
