import { ProductListItem } from "@/app/(dashboard)/products/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  ARTICLE_GROUP_LABELS,
  CE_STANDARD_LABELS,
  CERTIFICAAT_LABELS,
  PROCESSED_OPTION_LABELS,
  PRODUCT_DIMENSION_SHAPE_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
  PRODUCT_SHAPE_LABELS,
} from "@/lib/labels";

/**
 * The products overview as the reference's `Products` screen prints it: all 69
 * of its columns, in its own order — see app/(dashboard)/orders/columns.ts for
 * how one declaration feeds the table, the selector and the export.
 *
 * Units print as the reference's codes (`ST`, `M3`), not as words. Every column
 * is on by default, as on the reference.
 */

export type ProductColumnKey =
  | "productCode"
  | "name"
  | "groupProduct"
  | "stockProduct"
  | "standardProduct"
  | "mainGroup"
  | "subgroup"
  | "weight"
  | "weightUnit"
  | "length"
  | "widthDiameter"
  | "preferredLocation"
  | "preferredSupplierCode"
  | "preferredSupplierName"
  | "technicalStock"
  | "reservedQuantity"
  | "availableQuantity"
  | "stockUnit"
  | "makingOrderAdvices"
  | "pacCode"
  | "lastCount"
  | "turnoverRate"
  | "quality"
  | "qualityStandard"
  | "toleranceStandard"
  | "ceStandard"
  | "dop"
  | "alwaysReserveStock"
  | "avgMonthlyConsumption"
  | "tradeWeight"
  | "inWebsiteTree"
  | "websiteGroup"
  | "websiteGroup2"
  | "germanTradeWeight"
  | "theoreticalWeight"
  | "productType"
  | "fixed"
  | "lengthVariable"
  | "widthVariable"
  | "variable"
  | "form"
  | "thickness"
  | "thickness2"
  | "height"
  | "radius"
  | "paintSurface"
  | "weightDecimals"
  | "process"
  | "sourceProduct"
  | "industryCode"
  | "minimumLength"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "commodityCode"
  | "cdLocation"
  | "overlength"
  | "certificaat"
  | "revenueGroup"
  | "gipProductGroup"
  | "exportWebsite"
  | "blockedWebsite"
  | "descriptionShort"
  | "weightPerPiece"
  | "markArticle"
  | "priceOnRequest"
  | "grossPrice"
  | "createdAt"
  | "updatedAt";

type Column = ExportColumn<ProductListItem, ProductColumnKey>;

const column = (
  key: ProductColumnKey,
  label: string,
  value: (row: ProductListItem) => ExportCellValue,
): Column => ({ key, label, defaultVisible: true, value });

/** A column the reference prints that nothing in our schema backs yet. */
const blank = (key: ProductColumnKey, label: string): Column =>
  column(key, label, () => null);

export const PRODUCT_COLUMNS: Column[] = [
  column("productCode", "Product code", (row) => textCell(row.productCode)),
  column("name", "Product", (row) => textCell(row.name)),
  column("groupProduct", "Group product", (row) => yesNoCell(row.groupProduct)),
  column("stockProduct", "Stock product", (row) => yesNoCell(row.stockProduct)),
  column("standardProduct", "Standard product", (row) =>
    yesNoCell(row.standardProduct),
  ),
  column("mainGroup", "Main group", (row) => textCell(row.mainGroupName)),
  column("subgroup", "Subgroup", (row) => textCell(row.productGroupName)),
  // The figure the weight unit qualifies: 7850 per M3 is a density.
  column("weight", "Weight", (row) => numberCell(row.theoreticalWeight)),
  column("weightUnit", "WeightU", (row) => textCell(row.weightUnit)),
  column("length", "Length", (row) => numberCell(row.length)),
  column("widthDiameter", "Width/Diameter", (row) =>
    numberCell(row.widthDiameter),
  ),
  column("preferredLocation", "Preferred location", (row) =>
    textCell(row.preferredLocationName),
  ),
  column("preferredSupplierCode", "Preferred suppliers code", (row) =>
    textCell(row.preferredSupplierCode),
  ),
  column("preferredSupplierName", "Preferred suppliers name", (row) =>
    textCell(row.preferredSupplierName),
  ),
  column("technicalStock", "Technical stock", (row) => row.stockQuantity),
  column("reservedQuantity", "Reserved quantity", (row) => row.stockReserved),
  column("availableQuantity", "Available Quantity", (row) =>
    row.stockAvailable,
  ),
  column("stockUnit", "StkU", (row) => textCell(row.stockUnit)),
  column("makingOrderAdvices", "Making order advices", (row) =>
    yesNoCell(row.makingOrderAdvices),
  ),
  column("pacCode", "PAC code", (row) => textCell(row.pacClassification)),
  column("lastCount", "Last count", (row) => dateCell(row.lastCountDate)),
  // Computed by the order advice from a year of consumption; not stored.
  blank("turnoverRate", "Turnover rate"),
  column("quality", "Quality", (row) => textCell(row.featuresQuality)),
  column("qualityStandard", "Quality standard", (row) =>
    row.standardsQuality
      ? PRODUCT_QUALITY_STANDARD_LABELS[row.standardsQuality]
      : null,
  ),
  column("toleranceStandard", "Tolerance standard", (row) =>
    row.tolerance ? PRODUCT_QUALITY_STANDARD_LABELS[row.tolerance] : null,
  ),
  column("ceStandard", "CE standard", (row) =>
    row.ce ? CE_STANDARD_LABELS[row.ce] : null,
  ),
  // No column backs the declaration of performance yet.
  blank("dop", "DoP"),
  column("alwaysReserveStock", "Always reserve stock", (row) =>
    yesNoCell(row.alwaysReserveStock),
  ),
  // Computed by the order advice from a year of consumption; not stored.
  blank("avgMonthlyConsumption", "Avg. Monthly consumption"),
  column("tradeWeight", "Trade weight", (row) => numberCell(row.weightTrade)),
  // No column backs the website tree yet.
  blank("inWebsiteTree", "In website tree"),
  // No column backs the website group yet.
  blank("websiteGroup", "Website group"),
  // No column backs the second website group yet.
  blank("websiteGroup2", "Website group 2"),
  column("germanTradeWeight", "German trade weight", (row) =>
    numberCell(row.weightGerman),
  ),
  column("theoreticalWeight", "Theor. weight (kg)", (row) =>
    numberCell(row.weightTheoretical),
  ),
  column("productType", "Product type", (row) =>
    row.dimensionShape
      ? PRODUCT_DIMENSION_SHAPE_LABELS[row.dimensionShape]
      : null,
  ),
  column("fixed", "Fixed", (row) => yesNoCell(row.tradeLengthFixed)),
  // No column backs a variable length yet.
  blank("lengthVariable", "Length variable"),
  // No column backs a variable width yet.
  blank("widthVariable", "Width variable"),
  // No column backs the `Variable` flag yet.
  blank("variable", "Variable"),
  // Reasoned, not captured: the shape the product's group is set up as.
  column("form", "Form", (row) =>
    row.groupShape ? PRODUCT_SHAPE_LABELS[row.groupShape] : null,
  ),
  column("thickness", "Thickness", (row) => numberCell(row.thickness)),
  // No column backs a second thickness yet.
  blank("thickness2", "Thickness 2"),
  // No column backs a height yet.
  blank("height", "Height"),
  // No column backs a radius yet.
  blank("radius", "Radius"),
  column("paintSurface", "Paint surface (m2 per m1)", (row) =>
    numberCell(row.paintSurfacePerM1),
  ),
  column("weightDecimals", "Weight in #decimals", (row) =>
    numberCell(row.decimalPlaces),
  ),
  column("process", "Proces", (row) =>
    row.processedOption ? PROCESSED_OPTION_LABELS[row.processedOption] : null,
  ),
  column("sourceProduct", "Source product", (row) =>
    textCell(row.sourceProductCode),
  ),
  column("industryCode", "Industry code", (row) =>
    textCell(row.industryNumber),
  ),
  // Reasoned, not captured: the shortest length batch registration accepts.
  column("minimumLength", "Minimum Length", (row) =>
    numberCell(row.batchLengthMinimum),
  ),
  column("searchCode1", "Searchcode 1", (row) => textCell(row.searchCode1)),
  column("searchCode2", "Searchcode 2", (row) => textCell(row.searchCode2)),
  column("searchCode3", "Searchcode 3", (row) => textCell(row.searchCode3)),
  column("commodityCode", "Commodity code", (row) =>
    textCell(row.commodityCode),
  ),
  column("cdLocation", "CD-location", (row) => textCell(row.cdLocationName)),
  column("overlength", "Overlength", (row) => numberCell(row.overlength)),
  column("certificaat", "Certificaat", (row) =>
    row.certificaat ? CERTIFICAAT_LABELS[row.certificaat] : null,
  ),
  column("revenueGroup", "Revenue group", (row) =>
    textCell(row.revenueGroupName),
  ),
  column("gipProductGroup", "Gip product group", (row) =>
    row.articleGroup ? ARTICLE_GROUP_LABELS[row.articleGroup] : null,
  ),
  column("exportWebsite", "Export Website", (row) =>
    yesNoCell(row.websiteExport),
  ),
  column("blockedWebsite", "Blocked Website", (row) =>
    yesNoCell(row.websiteBlockedForSales),
  ),
  column("descriptionShort", "Description short", (row) =>
    yesNoCell(row.descriptionProductShort),
  ),
  column("weightPerPiece", "Weight per piece", (row) =>
    yesNoCell(row.showWeightPerPiece),
  ),
  column("markArticle", "Mark article", (row) =>
    yesNoCell(row.markProductGroup),
  ),
  column("priceOnRequest", "Price on request", (row) =>
    yesNoCell(row.priceOnRequest),
  ),
  // The list price before any contract discount.
  column("grossPrice", "Gross price", (row) => numberCell(row.basePrice)),
  column("createdAt", "Created", (row) => dateCell(row.createdAt)),
  column("updatedAt", "Adjusted", (row) => dateCell(row.updatedAt)),
];
