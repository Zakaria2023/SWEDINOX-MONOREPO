import type { StockLotOverviewRow } from "@/lib/server/stock-lot-overview";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  timeCell,
  yesNoCell,
} from "@/lib/excel";
import {
  FEATURES_QUALITY_LABELS,
  PRODUCT_DIMENSION_SHAPE_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";

// The account every lot is booked to in the reference — `3000 / Stock` on all
// 2 247 — and the one lib/server/ledger.ts posts stock to.
const STOCK_LEDGER_ACCOUNT = "3000";
const STOCK_LEDGER_ACCOUNT_NAME = "Stock";

/**
 * `Stock on location` — all 54 columns of the reference's export (2 247 lots,
 * docs/reference-system/stock-on-location.md), in its own order. `Customer
 * stock on location` prints the same 54, with the owner in front.
 *
 * Reasoned rather than captured, and said so at the column:
 * - `Gipgroup` has no source we know of (`Gip` is still unexplained — §3 of the
 *   doc); it reads blank. `Gip product group` is the product's article group,
 *   `PK304` on both screens.
 * - `Fixed dimensions` is the product's trade-length-fixed flag, the tick beside
 *   its dimensions.
 *
 * Every column is on by default: the reference's default view (`-leeg-`)
 * shows all 54.
 */

export type StockLotColumnKey =
  | "owner"
  | "productCode"
  | "description"
  | "applyOptimization"
  | "stockProduct"
  | "groupProduct"
  | "quantity"
  | "reserved"
  | "surface"
  | "qtyOrdered"
  | "lengthMm"
  | "location"
  | "locationType"
  | "blocked"
  | "section"
  | "widthMm"
  | "standardProduct"
  | "quantityKg"
  | "revenueGroupNumber"
  | "quality"
  | "ledgerAccountNumber"
  | "ledgerAccount"
  | "valuationPrice"
  | "priceUnit"
  | "stockValue"
  | "orderAdviceCode"
  | "charge"
  | "purchaseOrder"
  | "receiptDate"
  | "supplier"
  | "fixedDimensions"
  | "pacCode"
  | "theoreticalWeight"
  | "theoreticalWeightUnit"
  | "revenueGroup"
  | "mainQuality"
  | "qualitySpecification"
  | "thickness"
  | "theoreticalThickness"
  | "m1"
  | "stockUnit"
  | "available"
  | "productType"
  | "internalCharge"
  | "bundle"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "remark"
  | "stockCategory"
  | "options"
  | "gipGroup"
  | "gipProductGroup"
  | "createdAt"
  | "updatedAt";

type Column = ExportColumn<StockLotOverviewRow, StockLotColumnKey>;

const column = (
  key: StockLotColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: StockLotOverviewRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

/** `Created on` and `Modified on` carry the time as well as the day. */
const dateTimeOf = (value: Date | null): ExportCellValue => {
  const day = dateCell(value);
  const time = timeCell(value);
  return day instanceof Date && time
    ? `${day.toISOString().slice(0, 10)} ${time}`
    : day;
};

/** `Quality 3042B` = `Main quality 304` + `Quality specification 2B`. */
const qualitySpecificationOf = (row: StockLotOverviewRow): string | null => {
  const main = row.mainQuality ? FEATURES_QUALITY_LABELS[row.mainQuality] : null;
  if (!row.quality || !main || !row.quality.startsWith(main)) {
    return null;
  }
  return textCell(row.quality.slice(main.length)) as string | null;
};

export const STOCK_LOT_COLUMNS: Column[] = [
  column("productCode", "Product code", true, (row) => textCell(row.productCode)),
  column("description", "Description", true, (row) => textCell(row.productName)),
  column("applyOptimization", "Apply optimization", true, (row) =>
    yesNoCell(row.applyOptimization),
  ),
  column("stockProduct", "Stock product", true, (row) => yesNoCell(row.stockProduct)),
  column("groupProduct", "Group product", true, (row) => yesNoCell(row.groupProduct)),
  column("quantity", "Stock (Stk.U.)", true, (row) => numberCell(row.quantity)),
  column("reserved", "Reserved (Stk.U.)", true, (row) =>
    numberCell(row.reservedQuantity),
  ),
  // Filled on 91 of 2 247 lots in the reference, and the rule is unproved.
  // Ours is the plate's own surface for lots held by the square metre.
  column("surface", "Surf. (mm2)", true, (row) =>
    row.stockUnit === "M2" && row.lengthMm && row.widthMm
      ? row.lengthMm * row.widthMm * Number(row.quantity)
      : null,
  ),
  // Product-level — what is on order for the product, repeated on each of
  // its lots — and printed as 0 when nothing is, the way the reference does.
  column("qtyOrdered", "Qty ordered", true, (row) => row.qtyOrdered),
  column("lengthMm", "Length (mm)", true, (row) => numberCell(row.lengthMm)),
  column("location", "Location", true, (row) => textCell(row.locationName)),
  column("locationType", "Location type", true, (row) =>
    row.locationType ? WAREHOUSE_LOCATION_TYPE_LABELS[row.locationType] : null,
  ),
  column("blocked", "Blocked", true, (row) => yesNoCell(row.blocked)),
  column("section", "Warehouse section", true, (row) => textCell(row.sectionName)),
  column("widthMm", "Width (mm)", true, (row) => numberCell(row.widthMm)),
  column("standardProduct", "Standard product", true, (row) =>
    yesNoCell(row.standardProduct),
  ),
  column("quantityKg", "Stock (Kg)", true, (row) => numberCell(row.quantityKg)),
  column("revenueGroupNumber", "Revenue group no.", true, (row) =>
    numberCell(row.revenueGroupNumber),
  ),
  column("quality", "Quality", true, (row) => textCell(row.quality)),
  column("ledgerAccountNumber", "Stk-general ledger account no", true, () =>
    STOCK_LEDGER_ACCOUNT,
  ),
  column("ledgerAccount", "Stk-general ledger account", true, () =>
    STOCK_LEDGER_ACCOUNT_NAME,
  ),
  column("valuationPrice", "Valuation price", true, (row) =>
    numberCell(row.valuationPrice),
  ),
  // The valuation price is struck per tonne for every weighed lot.
  column("priceUnit", "PriceU", true, (row) => textCell(row.priceUnit ?? "TN")),
  column("stockValue", "Stock (€)", true, (row) => row.stockValue),
  column("orderAdviceCode", "Order advice code", true, (row) =>
    textCell(row.orderAdviceCode),
  ),
  column("charge", "Charge", true, (row) => textCell(row.charge)),
  column("purchaseOrder", "Purchase order", true, (row) =>
    row.purchaseOrderId ? `IO${row.purchaseOrderId}` : null,
  ),
  column("receiptDate", "Receipt date", true, (row) => dateCell(row.receiptDate)),
  column("supplier", "Supplier", true, (row) => textCell(row.supplierName)),
  column("fixedDimensions", "Fixed dimensions", true, (row) =>
    yesNoCell(row.fixedDimensions),
  ),
  column("pacCode", "PAC-Code", true, (row) => textCell(row.pacCode)),
  column("theoreticalWeight", "Theoretical Wt.", true, (row) =>
    numberCell(row.theoreticalWeight),
  ),
  column("theoreticalWeightUnit", "Theor. Wt. U.", true, (row) =>
    textCell(row.theoreticalWeightUnit),
  ),
  column("revenueGroup", "Revenue group", true, (row) =>
    textCell(row.revenueGroupName),
  ),
  column("mainQuality", "Main quality", true, (row) =>
    row.mainQuality ? FEATURES_QUALITY_LABELS[row.mainQuality] : null,
  ),
  column("qualitySpecification", "Quality specification", true, (row) =>
    qualitySpecificationOf(row),
  ),
  column("thickness", "Thickness", true, (row) => numberCell(row.thicknessMm)),
  column("theoreticalThickness", "Theoretical thickness", true, (row) =>
    numberCell(row.theoreticalThickness),
  ),
  // Running metres on the lot: quantity × length.
  column("m1", "M1", true, (row) =>
    row.lengthMm ? (Number(row.quantity) * row.lengthMm) / 1000 : null,
  ),
  column("stockUnit", "StkU", true, (row) => textCell(row.stockUnit)),
  column("available", "Available (StkU)", true, (row) => row.available),
  column("productType", "Product type", true, (row) =>
    row.productType ? PRODUCT_DIMENSION_SHAPE_LABELS[row.productType] : null,
  ),
  column("internalCharge", "Internal charge", true, (row) =>
    textCell(row.internalCharge),
  ),
  column("bundle", "Bundle", true, (row) => textCell(row.internalBatch)),
  column("searchCode1", "Searchcode 1", true, (row) => textCell(row.searchCode1)),
  column("searchCode2", "Searchcode 2", true, (row) => textCell(row.searchCode2)),
  column("searchCode3", "Searchcode 3", true, (row) => textCell(row.searchCode3)),
  column("remark", "Stock remark", true, (row) => textCell(row.remark)),
  column("stockCategory", "Stock category", true, (row) =>
    textCell(row.stockCategory),
  ),
  column("options", "Options", true, (row) => textCell(row.options)),
  column("gipGroup", "Gipgroup", true, () => null),
  column("gipProductGroup", "Gip product group", true, (row) =>
    textCell(row.articleGroup),
  ),
  column("createdAt", "Created on", true, (row) => dateTimeOf(row.createdAt)),
  column("updatedAt", "Modified on", true, (row) => dateTimeOf(row.updatedAt)),
];

/** The same 54, with the customer who owns the metal in front. */
export const CUSTOMER_STOCK_LOT_COLUMNS: Column[] = [
  column("owner", "Owner", true, (row) => textCell(row.ownerName)),
  ...STOCK_LOT_COLUMNS,
];
