import { OrderLineRow } from "@/app/(dashboard)/order-lines/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  COMPANY_CLASSIFICATION_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  ORDER_TYPE_LABELS,
} from "@/lib/labels";
import {
  orderLineStatusLabel,
  salesRepresentativeLabel,
  userName,
} from "@/lib/helpers";

/**
 * The order lines overview as a sheet, in the reference's column order.
 *
 * 🔴 **`Price -/- Cost price` deliberately disagrees with the reference.** Its
 * column subtracts the cost straight from the net price in the product's unit
 * — euros per piece from euros per tonne — and reconciles on all 4 975 of its
 * rows because both sides of its own subtraction are wrong together. Order
 * `O100220` line 20 reads 5 466.32 where the real per-tonne margin is about
 * 760. Ours converts the cost into the product's unit first, so it differs on
 * the 841 lines where the two units differ, and is right on all of them.
 *
 * Five of the reference's columns are not carried. `FSP` and `Replacement
 * price` are `0` on every one of 4 975 rows, which makes `Price -/- FSP`,
 * `Price -/- Replacement price` and `Profit margin w.r.t. replacement price`
 * decorative — they are the net price restated and a margin that reads 100
 * whenever the price is not zero. `Classification` and `Classification code`
 * are blank on every row, and `Affiliate company details` is one constant.
 *
 * A function rather than a constant, because one column needs something the row
 * does not carry: the seller is stored as a Clerk id and Clerk owns the names.
 * The page already has that map for the table, and the export action fetches it
 * before writing the file, so both spell the seller the same way.
 */

export type OrderLineColumnKey =
  | "createdAt"
  | "deliveryDate"
  | "customerName"
  | "reference"
  | "orderId"
  | "lineNumber"
  | "lineStatus"
  | "sourceType"
  | "productCode"
  | "description"
  | "options"
  | "lengthMm"
  | "widthMm"
  | "thicknessMm"
  | "quantity"
  | "unit"
  | "weightKg"
  | "price"
  | "priceUnit"
  | "costPrice"
  | "amount"
  | "profit"
  | "profitMargin"
  | "seller"
  | "ourReference"
  | "revenueGroupNumber"
  | "revenueGroupName"
  | "customerCode"
  | "city"
  | "priceInProductUnit"
  | "productPriceUnit"
  | "averagePurchasePrice"
  | "priceMinusCost"
  | "priceMinusApp"
  | "marginVsApp"
  | "deliveries"
  | "orderType"
  | "isConsignment"
  | "commercialShortfall"
  | "representative"
  | "sellerInitials"
  | "region"
  | "qualityCode"
  | "stockCategory"
  | "country"
  | "destinationCountry"
  | "fsp"
  | "priceMinusFsp"
  | "replacementPrice"
  | "priceMinusReplacement"
  | "marginVsReplacement"
  | "affiliateName"
  | "classification"
  | "classificationCode";

export const orderLineColumns = (
  userNames: Record<string, string>,
): Array<ExportColumn<OrderLineRow, OrderLineColumnKey>> => [
  {
    key: "createdAt",
    label: "Creation date",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "deliveryDate",
    label: "Delivery date",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDate),
  },
  {
    key: "customerName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
  },
  {
    key: "reference",
    label: "Reference",
    defaultVisible: true,
    value: (row) => textCell(row.reference),
  },
  {
    key: "orderId",
    label: "Order",
    defaultVisible: true,
    value: (row) => numberCell(row.orderId),
  },
  {
    key: "lineNumber",
    label: "Order line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "lineStatus",
    label: "Line status",
    defaultVisible: true,
    value: (row) => orderLineStatusLabel(row.lineStatus),
  },
  {
    key: "sourceType",
    label: "Line type",
    // The reference's `Line type`: Stk, Stk+CD or CD. Shown by default because
    // the two trade at very different margins — 20,09 % against 10,55 % — and
    // this is the only screen that lists lines one by one.
    defaultVisible: true,
    value: (row) => ORDER_SOURCE_TYPE_LABELS[row.sourceType],
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
    key: "options",
    label: "Options",
    defaultVisible: true,
    value: (row) => textCell(row.options),
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
    key: "thicknessMm",
    label: "Thickness",
    defaultVisible: true,
    value: (row) => numberCell(row.thicknessMm),
  },
  {
    key: "quantity",
    label: "Quantity (QtyU)",
    defaultVisible: true,
    value: (row) => numberCell(row.quantity),
  },
  {
    key: "unit",
    label: "QtyU",
    defaultVisible: true,
    value: (row) => textCell(row.unit?.toUpperCase()),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "price",
    label: "Net price (PriceU)",
    defaultVisible: true,
    value: (row) => numberCell(row.price),
  },
  {
    // The unit the customer is billed in, which is not always the unit the
    // product is held in: they differ on 841 of the reference's 4 975 lines.
    key: "priceUnit",
    label: "PriceU",
    defaultVisible: true,
    value: (row) => textCell(row.priceUnit),
  },
  {
    key: "costPrice",
    label: "Cost price",
    defaultVisible: true,
    value: (row) => numberCell(row.costPrice),
  },
  {
    key: "fsp",
    label: "FSP",
    defaultVisible: false,
    value: (row) => row.fsp,
  },
  {
    key: "amount",
    label: "Amount",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
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
    key: "seller",
    label: "Seller",
    defaultVisible: true,
    value: (row) => textCell(userName(row.seller, userNames)),
  },
  {
    key: "ourReference",
    label: "Our reference",
    defaultVisible: false,
    value: (row) => textCell(row.ourReference),
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
    defaultVisible: true,
    value: (row) => textCell(row.revenueGroupName),
  },
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => numberCell(row.customerCode),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: false,
    value: (row) => textCell(row.city),
  },
  {
    // The same agreed price as `Price`, restated in the unit the product is
    // held in. Equal to it wherever the two units match, which is 4 134 of the
    // reference's 4 975 rows.
    key: "priceInProductUnit",
    label: "Net price (ProdPriceU)",
    defaultVisible: false,
    value: (row) => numberCell(row.priceInProductUnit),
  },
  {
    key: "productPriceUnit",
    label: "Product PriceU.",
    defaultVisible: false,
    value: (row) => textCell(row.productPriceUnit),
  },
  {
    key: "classification",
    label: "Classification",
    defaultVisible: false,
    value: (row) =>
      row.classification ? COMPANY_CLASSIFICATION_LABELS[row.classification] : null,
  },
  {
    key: "classificationCode",
    label: "Classification code",
    defaultVisible: false,
    value: (row) => textCell(row.classification),
  },
  {
    key: "averagePurchasePrice",
    label: "APP",
    defaultVisible: false,
    value: (row) => numberCell(row.averagePurchasePrice),
  },
  {
    key: "priceMinusCost",
    label: "Price -/- Cost price",
    defaultVisible: false,
    value: (row) => numberCell(row.priceMinusCost),
  },
  {
    key: "priceMinusApp",
    label: "Price -/- APP",
    defaultVisible: false,
    value: (row) => numberCell(row.priceMinusApp),
  },
  {
    key: "marginVsApp",
    label: "Profit margin w.r.t. APP",
    defaultVisible: false,
    value: (row) => numberCell(row.marginVsApp),
  },
  {
    key: "priceMinusFsp",
    label: "Price -/- FSP",
    defaultVisible: false,
    value: (row) => numberCell(row.priceMinusFsp),
  },
  {
    key: "deliveries",
    label: "#Deliveries",
    defaultVisible: false,
    value: (row) => numberCell(row.deliveries),
  },
  {
    key: "replacementPrice",
    label: "Replacement price",
    defaultVisible: false,
    value: (row) => numberCell(row.replacementPrice),
  },
  {
    key: "priceMinusReplacement",
    label: "Price -/- Replacement price",
    defaultVisible: false,
    value: (row) => numberCell(row.priceMinusReplacement),
  },
  {
    key: "marginVsReplacement",
    label: "Profit margin w.r.t. replacement price",
    defaultVisible: false,
    value: (row) => numberCell(row.marginVsReplacement),
  },
  {
    // The ORDER's own type, which is not the line's supply route. The
    // reference prints both and calls one `Line type` and the other
    // `Order type`; they carry Stk/CD/Stk+CD/EXW and
    // Normal/Call-off/Rush/Ex works respectively.
    key: "orderType",
    label: "Order type",
    defaultVisible: false,
    value: (row) =>
      textCell(row.orderType ? ORDER_TYPE_LABELS[row.orderType] : null),
  },
  {
    key: "isConsignment",
    label: "Consignment",
    defaultVisible: false,
    value: (row) => yesNoCell(row.isConsignment),
  },
  {
    key: "commercialShortfall",
    label: "Commercial shortfall",
    defaultVisible: false,
    value: (row) => yesNoCell(row.commercialShortfall),
  },
  {
    key: "representative",
    label: "Representative",
    defaultVisible: false,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "sellerInitials",
    label: "Initials",
    defaultVisible: false,
    value: (row) => {
      const name = userName(row.seller, userNames);
      const words = name.split(" ").filter(Boolean);
      return textCell(
        words.length < 2
          ? null
          : words.map((word) => word[0]?.toUpperCase() ?? "").join(""),
      );
    },
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: false,
    value: (row) => textCell(row.region),
  },
  {
    key: "affiliateName",
    label: "Affiliate company details",
    defaultVisible: false,
    value: (row) => textCell(row.affiliateName),
  },
  {
    key: "qualityCode",
    label: "Quality Code",
    defaultVisible: false,
    value: (row) => textCell(row.qualityCode),
  },
  {
    key: "stockCategory",
    label: "Stock category",
    defaultVisible: false,
    value: (row) => textCell(row.stockCategory),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: false,
    value: (row) => textCell(row.country),
  },
  {
    // Where the goods go. It differs from the customer's own country on the
    // reference's rows where an order ships somewhere else.
    key: "destinationCountry",
    label: "Destination country",
    defaultVisible: false,
    value: (row) => textCell(row.destinationCountry),
  },
];
