import { ProductPriceRow } from "@/app/(dashboard)/product-prices/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { articlePieceWeightKg } from "@/lib/helpers";

/**
 * `Product prices` — all 47 columns of the reference's export (19 383
 * articles, docs/reference-system/product-prices.md), in its own order.
 *
 * Where the figures come from:
 * - `LPP` (last purchase price) and `APP` (average purchase price) are read
 *   back from the supplier invoices, because that is where a purchase price is
 *   recorded.
 * - `FSP` and `Replacement price` are today's row of the product's dated FSP
 *   history; `FSP` falls back to the product's own fixed sales price.
 *
 * ⚪ Blank on all 19 383 reference rows, and blank here because nothing in this
 * app prices them: `Scrap surcharge`, `Quality surcharge`, the blasting and
 * sawing prices, `Color surcharge` and `PriceA`–`PriceD`.
 */

export type ProductPriceColumnKey =
  | "productCode"
  | "oldProductCode"
  | "name"
  | "priceUnit"
  | "groupProduct"
  | "stockProduct"
  | "standardProduct"
  | "mainGroup"
  | "revenueGroup"
  | "preferredSupplier"
  | "supplierProductCode"
  | "currentReplacementPrice"
  | "basePrice"
  | "markup"
  | "averagePurchasePrice"
  | "scrapSurcharge"
  | "qualitySurcharge"
  | "orderAdviceCode"
  | "fixedSalesPrice"
  | "priceDate"
  | "paintSurface"
  | "tradeLength"
  | "weightPerUnit"
  | "weightUnit"
  | "weightPerPiece"
  | "blastingPrice"
  | "blastingPriceUnit"
  | "blastingPrimedPrice"
  | "blastingPrimedPriceUnit"
  | "sawingPriceStraight"
  | "sawingPriceMiterEqual"
  | "sawingPriceMiterUneven"
  | "sawingPriceUnit"
  | "colorSurcharge"
  | "colorSurchargeUnit"
  | "lastPurchasePrice"
  | "subGroup"
  | "revenueGroupNumber"
  | "priceA"
  | "priceB"
  | "priceC"
  | "priceD"
  | "export"
  | "overlength"
  | "validUntil"
  | "inWebsiteTree"
  | "validFrom";

type Column = ExportColumn<ProductPriceRow, ProductPriceColumnKey>;

const column = (
  key: ProductPriceColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: ProductPriceRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const blank = () => null;

export const PRODUCT_PRICE_COLUMNS: Column[] = [
  column("productCode", "Product code", true, (row) => textCell(row.productCode)),
  column("oldProductCode", "Old product no.", true, (row) =>
    textCell(row.oldProductCode),
  ),
  column("name", "Product", true, (row) => textCell(row.name)),
  column("priceUnit", "PriceU", true, (row) => textCell(row.priceUnit)),
  column("groupProduct", "Group product", true, (row) =>
    yesNoCell(row.groupProduct),
  ),
  column("stockProduct", "Stock product", true, (row) =>
    yesNoCell(row.stockProduct),
  ),
  column("standardProduct", "Standard product", true, (row) =>
    yesNoCell(row.standardProduct),
  ),
  column("mainGroup", "Main group", true, (row) => textCell(row.mainGroup)),
  column("revenueGroup", "Revenue group", true, (row) =>
    textCell(row.revenueGroupName),
  ),
  column("preferredSupplier", "Preferred supplier", true, (row) =>
    textCell(row.preferredSupplier),
  ),
  column("supplierProductCode", "Product no. supplier", true, (row) =>
    textCell(row.supplierProductCode),
  ),
  column("currentReplacementPrice", "Replacement price", true, (row) =>
    numberCell(row.currentReplacementPrice),
  ),
  column("basePrice", "Gross price/Base price", true, (row) =>
    numberCell(row.basePrice),
  ),
  column("markup", "Markup", true, (row) => numberCell(row.markup)),
  column("averagePurchasePrice", "APP", true, (row) =>
    numberCell(row.averagePurchasePrice),
  ),
  column("scrapSurcharge", "Scrap surcharge", false, blank),
  column("qualitySurcharge", "Quality surcharge", false, blank),
  column("orderAdviceCode", "Order advice code", false, (row) =>
    textCell(row.orderAdviceCode),
  ),
  column("fixedSalesPrice", "FSP", true, (row) =>
    numberCell(row.currentFsp ?? row.fixedSalesPrice),
  ),
  column("priceDate", "Price date", false, (row) => dateCell(row.priceDate)),
  column("paintSurface", "Paint surface", false, (row) =>
    numberCell(row.paintSurfacePerM1),
  ),
  column("tradeLength", "Trade dim. (mm)", false, (row) =>
    numberCell(row.tradeLength),
  ),
  // ⚠️ In `M3` a density in kg/m³ (7 850 steel, 8 000 stainless), not a weight.
  column("weightPerUnit", "Kg. (per KgU)", false, (row) =>
    numberCell(row.theoreticalWeight),
  ),
  column("weightUnit", "KgU", false, (row) => textCell(row.weightUnit)),
  column("weightPerPiece", "Kg. (per Piece)", false, (row) =>
    articlePieceWeightKg(row),
  ),
  column("blastingPrice", "Base price Blasting", false, blank),
  column("blastingPriceUnit", "PriceU. Blasting", false, blank),
  column("blastingPrimedPrice", "Base price Bls+P", false, blank),
  column("blastingPrimedPriceUnit", "PriceU. Bls+P", false, blank),
  column("sawingPriceStraight", "Sawing price straight", false, blank),
  column("sawingPriceMiterEqual", "Sawing price miter straight/equal", false, blank),
  column("sawingPriceMiterUneven", "Sawing price miter uneven", false, blank),
  column("sawingPriceUnit", "Sawing price U.", false, blank),
  column("colorSurcharge", "Color surcharge", false, blank),
  column("colorSurchargeUnit", "Color surcharge U", false, blank),
  column("lastPurchasePrice", "LPP", true, (row) =>
    numberCell(row.replacementPrice),
  ),
  column("subGroup", "Subgroup", true, (row) => textCell(row.subGroup)),
  column("revenueGroupNumber", "Revenue group number", false, (row) =>
    numberCell(row.revenueGroupNumber),
  ),
  column("priceA", "PriceA", false, blank),
  column("priceB", "PriceB", false, blank),
  column("priceC", "PriceC", false, blank),
  column("priceD", "PriceD", false, blank),
  column("export", "Export", false, (row) => yesNoCell(row.websiteExport)),
  column("overlength", "Overlength", false, (row) =>
    Number(row.overlength ?? 0) === 0 ? null : numberCell(row.overlength),
  ),
  column("validUntil", "Valid u/i", false, blank),
  column("inWebsiteTree", "In website tree", false, (row) =>
    yesNoCell(row.showOnWebsite),
  ),
  column("validFrom", "Valid from", false, blank),
];
