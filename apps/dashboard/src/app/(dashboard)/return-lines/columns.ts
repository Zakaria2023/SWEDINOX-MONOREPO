import type { ReturnLineRow } from "@/app/(dashboard)/return-lines/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  documentProfitMarginPercent,
  priceMeasureFor,
  userName,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  RETURN_ORDER_REASON_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

/**
 * `Return lines` — all 64 columns of the reference's export (88 lines,
 * docs/reference-system/returns-and-complaints.md), in its own order.
 *
 * 🔑 A return reads **negative** there: `Quantity -1`, `Weight -176,7`,
 * `Amount -349,87`. Ours stores the returned quantities and amounts as
 * positive figures, so the overview turns them the reference's way round.
 *
 * Reasoned rather than captured:
 * - `Affiliate company details` reads blank until the branch carries its own
 *   legal name (the reference prints `HEGO TEST Stainless Steel & Aluminium`).
 * - `Commercial shortfall` is `False` on all 88 and we hold nothing that sets
 *   it; it reads `No`.
 * - `Classification code` / `Classification` are blank on all 88 and on the
 *   company record; they read blank.
 */

export type ReturnLineColumnKey =
  | "order"
  | "reference"
  | "orderLine"
  | "createdAt"
  | "productCode"
  | "description"
  | "revenueGroupNumber"
  | "revenueGroup"
  | "customerCode"
  | "customer"
  | "city"
  | "lineType"
  | "quantity"
  | "quantityUnit"
  | "lengthMm"
  | "thickness"
  | "weightKg"
  | "lineStatus"
  | "netPrice"
  | "priceUnit"
  | "costPrice"
  | "fsp"
  | "app"
  | "amount"
  | "profit"
  | "profitMargin"
  | "priceLessCost"
  | "priceLessApp"
  | "marginOnApp"
  | "priceLessFsp"
  | "deliveryDate"
  | "orderType"
  | "deliveries"
  | "replacementPrice"
  | "priceLessReplacement"
  | "marginOnReplacement"
  | "consignment"
  | "commercialShortfall"
  | "representative"
  | "seller"
  | "initials"
  | "region"
  | "affiliate"
  | "classificationCode"
  | "classification"
  | "netPriceProductUnit"
  | "complaint"
  | "complaintDescription"
  | "originalOrder"
  | "originalOrderLine"
  | "complaintDate"
  | "originalBillOfLading"
  | "returnBillOfLading"
  | "returnDeliveryDate"
  | "returnQty"
  | "returnReason"
  | "productPriceUnit"
  | "widthMm"
  | "ourReference"
  | "qualityCode"
  | "stockCategory"
  | "options"
  | "country"
  | "destinationCountry";

type Column = ExportColumn<ReturnLineRow, ReturnLineColumnKey>;

const column = (
  key: ReturnLineColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: ReturnLineRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const negative = (value: string | null): number | null =>
  value === null ? null : -Math.abs(Number(value));

/** Amount and cost on the line's own price unit, signed as a return. */
const money = (row: ReturnLineRow) => {
  const basis =
    priceMeasureFor(row.priceUnit, {
      quantity: Math.abs(Number(row.quantity ?? 0)),
      weightKg: Math.abs(Number(row.weightKg ?? 0)),
      lengthMm: row.lengthMm,
      widthMm: row.widthMm,
      thicknessMm: row.thicknessMm === null ? null : Number(row.thicknessMm),
    }) ?? Math.abs(Number(row.quantity ?? 0));
  const amount = -Math.abs(Number(row.amount ?? 0));
  const cost = -Math.abs(Number(row.costPrice ?? 0) * basis);
  return { amount, profit: amount - cost };
};

/** `Price -/- X` and its margin, against the line's net price. */
const priceLess = (row: ReturnLineRow, basis: string | null) =>
  Number(row.netPrice ?? 0) - Number(basis ?? 0);

const marginAgainst = (row: ReturnLineRow, basis: string | null) =>
  documentProfitMarginPercent(Number(row.netPrice ?? 0), priceLess(row, basis));

const initialsOf = (name: string): string | null => {
  const words = name.split(" ").filter(Boolean);
  return words.length < 2
    ? null
    : words.map((word) => word[0]?.toUpperCase() ?? "").join("");
};

export const returnLineColumns = (
  userNames: Record<string, string>,
): Column[] => [
  column("order", "Order", true, (row) =>
    row.returnOrderId === null ? null : `R${row.returnOrderId}`,
  ),
  column("reference", "Reference", true, (row) =>
    textCell(row.reference ?? row.returnOrderRef),
  ),
  column("orderLine", "Order line", true, (row) => numberCell(row.lineNumber)),
  column("createdAt", "Creation date", true, (row) => dateCell(row.createdAt)),
  column("productCode", "Product code", true, (row) => textCell(row.productCode)),
  column("description", "Description", true, (row) => textCell(row.productName)),
  column("revenueGroupNumber", "Revenue group number", false, (row) =>
    numberCell(row.revenueGroupNumber),
  ),
  column("revenueGroup", "Revenue group", false, (row) =>
    textCell(row.revenueGroupName),
  ),
  column("customerCode", "Customer code", false, (row) =>
    numberCell(row.customerCode),
  ),
  column("customer", "Customer", true, (row) => textCell(row.customerName)),
  column("city", "City", false, (row) => textCell(row.city)),
  column("lineType", "Line type", false, (row) => textCell(row.lineType)),
  column("quantity", "Quantity (QtyU)", true, (row) => negative(row.quantity)),
  column("quantityUnit", "QtyU", true, (row) => textCell(row.unit?.toUpperCase())),
  column("lengthMm", "Length (mm)", false, (row) => numberCell(row.lengthMm)),
  column("thickness", "Thickness", false, (row) => numberCell(row.thicknessMm)),
  column("weightKg", "Weight (kg)", true, (row) => negative(row.weightKg)),
  column("lineStatus", "Line status", true, (row) =>
    row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null,
  ),
  column("netPrice", "Net price (PriceU)", true, (row) => numberCell(row.netPrice)),
  column("priceUnit", "PriceU", true, (row) => textCell(row.priceUnit)),
  column("costPrice", "Cost price", false, (row) => numberCell(row.costPrice)),
  column("fsp", "FSP", false, (row) => numberCell(row.fsp)),
  column("app", "APP", false, (row) => numberCell(row.app)),
  column("amount", "Amount", true, (row) => money(row).amount),
  column("profit", "Profit", true, (row) => money(row).profit),
  column("profitMargin", "Profit margin", true, (row) => {
    const { amount, profit } = money(row);
    return documentProfitMarginPercent(amount, profit);
  }),
  column("priceLessCost", "Price -/- Cost price", false, (row) =>
    priceLess(row, row.costPrice),
  ),
  column("priceLessApp", "Price -/- APP", false, (row) => priceLess(row, row.app)),
  column("marginOnApp", "Profit margin w.r.t. APP", false, (row) =>
    marginAgainst(row, row.app),
  ),
  column("priceLessFsp", "Price -/- FSP", false, (row) => priceLess(row, row.fsp)),
  column("deliveryDate", "Delivery date", false, (row) => dateCell(row.deliveryDate)),
  column("orderType", "Order type", false, (row) =>
    ORDER_TYPE_LABELS[row.originalOrderType ?? "normal"],
  ),
  column("deliveries", "#Deliveries", false, (row) => row.deliveries),
  column("replacementPrice", "Replacement price", false, (row) =>
    numberCell(row.replacementPrice),
  ),
  column("priceLessReplacement", "Price -/- Replacement price", false, (row) =>
    priceLess(row, row.replacementPrice),
  ),
  column(
    "marginOnReplacement",
    "Profit margin w.r.t. replacement price",
    false,
    (row) => marginAgainst(row, row.replacementPrice),
  ),
  column("consignment", "Consignment", false, (row) =>
    yesNoCell(row.originalConsignment),
  ),
  column("commercialShortfall", "Commercial shortfall", false, () =>
    yesNoCell(false),
  ),
  column("representative", "Representative", false, (row) =>
    row.representative ? SALES_REPRESENTATIVE_LABELS[row.representative] : null,
  ),
  column("seller", "Seller", false, (row) =>
    row.seller ? userName(row.seller, userNames) : null,
  ),
  column("initials", "Initials", false, (row) =>
    row.seller ? initialsOf(userName(row.seller, userNames)) : null,
  ),
  column("region", "Region", false, (row) => textCell(row.region)),
  column("affiliate", "Affiliate company details", false, () => null),
  column("classificationCode", "Classification code", false, () => null),
  column("classification", "Classification", false, () => null),
  // The price restated in the product's own unit — the same figure when, as on
  // all 88 reference rows, both are per tonne.
  column("netPriceProductUnit", "Net price (ProdPriceU)", false, (row) =>
    (row.productPriceUnit ?? row.priceUnit) === row.priceUnit
      ? numberCell(row.netPrice)
      : null,
  ),
  column("complaint", "Complaint", true, (row) =>
    row.complaintNumber === null ? null : `K${row.complaintNumber}`,
  ),
  column("complaintDescription", "Complaint description", false, (row) =>
    textCell(row.complaintDescription),
  ),
  column("originalOrder", "Original order", true, (row) =>
    row.originalOrderId === null ? null : `O${row.originalOrderId}`,
  ),
  column("originalOrderLine", "Original order line", true, (row) =>
    numberCell(row.originalLineNumber ?? row.originalOrderLine),
  ),
  column("complaintDate", "Complaint date", false, (row) =>
    dateCell(row.complaintDate),
  ),
  column("originalBillOfLading", "Original bill of lading", false, (row) =>
    textCell(row.originalBillOfLading),
  ),
  // Filled on 2 of 88 in the reference; a return receipt names none here.
  column("returnBillOfLading", "Return bill of lading", false, () => null),
  column("returnDeliveryDate", "Return delivery date", false, (row) =>
    dateCell(row.deliveryDate),
  ),
  column("returnQty", "Return Qty", true, (row) => numberCell(row.returnQty)),
  column("returnReason", "Return reason", true, (row) =>
    row.returnReason ? RETURN_ORDER_REASON_LABELS[row.returnReason] : null,
  ),
  column("productPriceUnit", "Product PriceU.", false, (row) =>
    textCell(row.productPriceUnit ?? row.priceUnit),
  ),
  column("widthMm", "Width (mm)", false, (row) => numberCell(row.widthMm)),
  column("ourReference", "Our reference", false, (row) => textCell(row.ourReference)),
  column("qualityCode", "Quality Code", false, (row) => textCell(row.qualityCode)),
  column("stockCategory", "Stock category", false, (row) =>
    textCell(row.stockCategory),
  ),
  column("options", "Options", false, (row) => textCell(row.options)),
  column("country", "Country", false, (row) => textCell(row.country)),
  column("destinationCountry", "Destination country", false, (row) =>
    textCell(row.destinationCountry),
  ),
];
