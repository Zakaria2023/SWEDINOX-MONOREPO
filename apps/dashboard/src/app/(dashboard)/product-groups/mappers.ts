import { SelectProductGroupSuppliers } from "@/db/schema/product-group-suppliers";
import { SelectProductGroups } from "@/db/schema/product-groups";
import {
  articleGroupMetaOf,
  derivedWeightColumns,
  DIMENSION_SHAPE_FOR_PRODUCT_SHAPE,
  revenueGroupForMaterialGrade,
} from "@/lib/helpers";
import { ProductGroupFields, ProductGroupSupplierInput } from "./actions";
import {
  DEFAULT_PRODUCT_GROUP,
  ProductGroupFormValues,
  ProductGroupSupplierValues,
} from "./validation";

/** A stored product group in the shape its form edits. */
export const productGroupToFormValues = (
  group: SelectProductGroups,
  suppliers: SelectProductGroupSuppliers[],
): ProductGroupFormValues => ({
  parentUuid: group.parentUuid,
  name: group.name,
  productShape: group.productShape ?? undefined,
  groupLongDesc: group.groupLongDesc ?? "",
  groupShortDesc: group.groupShortDesc ?? "",
  productShapeDesc: group.productShapeDesc ?? "",
  materialGroup: group.materialGroup ?? "",
  commodity: group.commodity ?? "",
  scrap: group.scrap ?? false,
  packaging: group.packaging ?? false,
  descSalesPurchaseOverridable: group.descSalesPurchaseOverridable ?? false,
  searchCode1: group.searchCode1 ?? "",
  searchCode2: group.searchCode2 ?? "",
  searchCode3: group.searchCode3 ?? "",
  articleGroup: group.articleGroup ?? undefined,

  length: group.length ?? "",
  width: group.width ?? "",
  thickness: group.thickness ?? "",
  decimalPlaces: group.decimalPlaces ?? "0",
  printDimensions: group.printDimensions ?? false,

  weight: group.weight ?? "",
  paintSurface: group.paintSurface ?? "",
  featuresQuality: group.featuresQuality ?? undefined,
  weightTheoretical: group.weightTheoretical ?? "0.000",
  weightTrade: group.weightTrade ?? "0.000",
  weightGerman: group.weightGerman ?? "0.000",

  standardsQuality: group.standardsQuality ?? undefined,
  tolerance: group.tolerance ?? undefined,
  ce: group.ce ?? undefined,
  options: group.options ?? [],
  processedOption: group.processedOption ?? undefined,
  sourceProduct: group.sourceProduct ?? "",
  industryNumber: group.industryNumber ?? "",

  purchasingUnit: group.purchasingUnit ?? undefined,
  unitPrice: group.unitPrice ?? undefined,
  deliveryTime: group.deliveryTime ?? 0,
  deliveryTimeUnit: group.deliveryTimeUnit ?? undefined,
  orderSeries: group.orderSeries ?? 0,
  blockedForPurchasing: group.blockedForPurchasing ?? false,
  makingOrderAdvices: group.makingOrderAdvices ?? false,
  orderingAdviceNotes: group.orderingAdviceNotes ?? "",
  productCodeOnPurchase: group.productCodeOnPurchase ?? false,
  maxLineQty: group.maxLineQty ?? DEFAULT_PRODUCT_GROUP.maxLineQty,
  maxNetPrice: group.maxNetPrice ?? DEFAULT_PRODUCT_GROUP.maxNetPrice,

  packagingMandatoryOnCompletion: group.packagingMandatoryOnCompletion ?? false,
  receiptInLocationsWithLimitedDimensions:
    group.receiptInLocationsWithLimitedDimensions ?? false,
  goodsReceiptTerm: group.goodsReceiptTerm ?? 0,
  includeInCsvForStockLabels: group.includeInCsvForStockLabels ?? false,
  suggestLastUsedChargeInScanner: group.suggestLastUsedChargeInScanner ?? false,
  stockLabelType: group.stockLabelType ?? undefined,
  stockLabelPrinting: group.stockLabelPrinting ?? undefined,
  toleranceUnloadingQty:
    group.toleranceUnloadingQty ?? DEFAULT_PRODUCT_GROUP.toleranceUnloadingQty,
  toleranceUnloadingKg:
    group.toleranceUnloadingKg ?? DEFAULT_PRODUCT_GROUP.toleranceUnloadingKg,
  toleranceCountQty:
    group.toleranceCountQty ?? DEFAULT_PRODUCT_GROUP.toleranceCountQty,
  toleranceCountKg:
    group.toleranceCountKg ?? DEFAULT_PRODUCT_GROUP.toleranceCountKg,
  tolerancePickingQty:
    group.tolerancePickingQty ?? DEFAULT_PRODUCT_GROUP.tolerancePickingQty,
  tolerancePickingKg:
    group.tolerancePickingKg ?? DEFAULT_PRODUCT_GROUP.tolerancePickingKg,
  toleranceProductionQty:
    group.toleranceProductionQty ??
    DEFAULT_PRODUCT_GROUP.toleranceProductionQty,
  toleranceProductionKg:
    group.toleranceProductionKg ??
    DEFAULT_PRODUCT_GROUP.toleranceProductionKg,
  customerLabelForPickingSlip: group.customerLabelForPickingSlip ?? undefined,
  customerLabelForSawingSlip: group.customerLabelForSawingSlip ?? undefined,
  customerLabelAtSurfTreatSlip: group.customerLabelAtSurfTreatSlip ?? undefined,
  alwaysApproveManuallyWarehouseWorkorderLine:
    group.alwaysApproveManuallyWarehouseWorkorderLine ?? false,
  alwaysApproveManuallyProductionWorkorderLine:
    group.alwaysApproveManuallyProductionWorkorderLine ?? false,

  minStockMode: group.minStockMode ?? "multiplier",
  minStockMultiplier:
    group.minStockMultiplier ?? DEFAULT_PRODUCT_GROUP.minStockMultiplier,
  minStockFixedValue:
    group.minStockFixedValue ?? DEFAULT_PRODUCT_GROUP.minStockFixedValue,
  minStockUnit: group.minStockUnit ?? "",
  maxStockMode: group.maxStockMode ?? "multiplier",
  maxStockMultiplier:
    group.maxStockMultiplier ?? DEFAULT_PRODUCT_GROUP.maxStockMultiplier,
  maxStockFixedValue:
    group.maxStockFixedValue ?? DEFAULT_PRODUCT_GROUP.maxStockFixedValue,
  maxStockUnit: group.maxStockUnit ?? "",
  leadTimeMethod: group.leadTimeMethod ?? "manually",
  leadTime: group.leadTime ?? 0,
  reviewPeriod: group.reviewPeriod ?? 0,
  orderCostsPurchasingSide:
    group.orderCostsPurchasingSide ??
    DEFAULT_PRODUCT_GROUP.orderCostsPurchasingSide,
  orderCostsLogistics:
    group.orderCostsLogistics ?? DEFAULT_PRODUCT_GROUP.orderCostsLogistics,
  stockOpOrderSeries:
    group.stockOpOrderSeries ?? DEFAULT_PRODUCT_GROUP.stockOpOrderSeries,
  minOrderQty: group.minOrderQty ?? DEFAULT_PRODUCT_GROUP.minOrderQty,
  useStockOpForThisProduct: group.useStockOpForThisProduct ?? false,
  orderOnMonday: group.orderOnMonday ?? true,
  orderOnTuesday: group.orderOnTuesday ?? true,
  orderOnWednesday: group.orderOnWednesday ?? true,
  orderOnThursday: group.orderOnThursday ?? true,
  orderOnFriday: group.orderOnFriday ?? true,
  capitalCost: group.capitalCost ?? DEFAULT_PRODUCT_GROUP.capitalCost,
  warehouseCost: group.warehouseCost ?? DEFAULT_PRODUCT_GROUP.warehouseCost,
  b2StockoutPct1: group.b2StockoutPct1 ?? DEFAULT_PRODUCT_GROUP.b2StockoutPct1,
  b2StockoutPct2: group.b2StockoutPct2 ?? DEFAULT_PRODUCT_GROUP.b2StockoutPct2,
  handling: group.handling ?? DEFAULT_PRODUCT_GROUP.handling,
  transport: group.transport ?? DEFAULT_PRODUCT_GROUP.transport,
  pacClassification: group.pacClassification ?? "",
  orderAdviceCode: group.orderAdviceCode ?? "",

  revenueGroup: group.revenueGroup ?? undefined,
  salesUnit: group.salesUnit ?? undefined,
  salesUnitPrice: group.salesUnitPrice ?? undefined,
  vatCode: group.vatCode ?? undefined,
  roundWeightPerPieceUp: group.roundWeightPerPieceUp ?? false,
  benorProduct: group.benorProduct ?? false,
  productCodeOnQuoteOrderInvoice: group.productCodeOnQuoteOrderInvoice ?? false,
  certificaat: group.certificaat ?? undefined,
  websiteExport: group.websiteExport ?? false,
  websiteBlockedForSales: group.websiteBlockedForSales ?? false,
  descriptionProductShort: group.descriptionProductShort ?? false,
  showWeightPerPiece: group.showWeightPerPiece ?? false,
  showPackagingPerPiece: group.showPackagingPerPiece ?? false,
  markProductGroup: group.markProductGroup ?? false,
  priceOnRequest: group.priceOnRequest ?? false,
  minProfitMarginStock:
    group.minProfitMarginStock ?? DEFAULT_PRODUCT_GROUP.minProfitMarginStock,
  minProfitMarginExWorks:
    group.minProfitMarginExWorks ??
    DEFAULT_PRODUCT_GROUP.minProfitMarginExWorks,
  minProfitMarginCrossDocking:
    group.minProfitMarginCrossDocking ??
    DEFAULT_PRODUCT_GROUP.minProfitMarginCrossDocking,
  severalBlockedForSales: group.severalBlockedForSales ?? false,
  vehicleWithCraneRequired: group.vehicleWithCraneRequired ?? false,
  vehicleWithCanopyRequired: group.vehicleWithCanopyRequired ?? false,
  alwaysReserveStock: group.alwaysReserveStock ?? false,
  maxSalesLineQty:
    group.maxSalesLineQty ?? DEFAULT_PRODUCT_GROUP.maxSalesLineQty,
  maxSalesNetPrice:
    group.maxSalesNetPrice ?? DEFAULT_PRODUCT_GROUP.maxSalesNetPrice,
  handlingCosts: group.handlingCosts ?? DEFAULT_PRODUCT_GROUP.handlingCosts,

  suppliers: suppliers.map(
    (supplier): ProductGroupSupplierValues => ({
      supplierCompanyUuid: supplier.supplierCompanyUuid,
      preferred: supplier.preferred ?? false,
      ean: supplier.ean ?? "",
      externalProductCode: supplier.externalProductCode ?? "",
      editing: supplier.editing ?? "",
      deliveryTime: supplier.deliveryTime ?? 0,
      deliveryTimeUnit: supplier.deliveryTimeUnit ?? undefined,
      moq: supplier.moq ?? "0.000",
      moqUnit: supplier.moqUnit ?? undefined,
      orderSeries: supplier.orderSeries ?? 0,
      orderSeriesUnit: supplier.orderSeriesUnit ?? undefined,
    }),
  ),

  documents: group.documents ?? [],
});

/**
 * The form's values as columns.
 *
 * Both creating and saving a section go through here, so the two can't
 * disagree about how a blank select or an empty text box reaches the database.
 */
export const formValuesToProductGroupFields = (
  values: ProductGroupFormValues,
): ProductGroupFields => {
  // The group's shape, dimensions and grade decide its weight per metre, its
  // paintable surface and the weight of one piece. A group carries only the
  // coarse shape, so the cross-section it is weighed with is the one that shape
  // implies; a piece article has no cross-section and keeps what was typed.
  const derived = derivedWeightColumns(
    values.productShape
      ? DIMENSION_SHAPE_FOR_PRODUCT_SHAPE[values.productShape]
      : null,
    {
      length: Number(values.length || 0),
      widthDiameter: Number(values.width || 0),
      thickness: Number(values.thickness || 0),
    },
    values.featuresQuality,
  );

  // A revenue group nobody picked is not a blank: the grade says which metal is
  // being sold and the article group says which group its articles roll into,
  // and either answers it. The grade wins, being the more specific of the two.
  const revenueGroup =
    values.revenueGroup ||
    revenueGroupForMaterialGrade(values.featuresQuality) ||
    articleGroupMetaOf(values.articleGroup)?.revenueGroup ||
    null;

  return {
    parentUuid: values.parentUuid || null,
    name: values.name,
    productShape: values.productShape || null,
    groupLongDesc: values.groupLongDesc || null,
    groupShortDesc: values.groupShortDesc || null,
    productShapeDesc: values.productShapeDesc || null,
    materialGroup: values.materialGroup || null,
    commodity: values.commodity || null,
    scrap: values.scrap,
    packaging: values.packaging,
    descSalesPurchaseOverridable: values.descSalesPurchaseOverridable,
    searchCode1: values.searchCode1 || null,
    searchCode2: values.searchCode2 || null,
    searchCode3: values.searchCode3 || null,
    articleGroup: values.articleGroup || null,

    length: values.length || null,
    width: values.width || null,
    thickness: values.thickness || null,
    decimalPlaces: values.decimalPlaces || "0",
    printDimensions: values.printDimensions,

    weight: derived.weightPerM1 ?? values.weight ?? null,
    paintSurface: derived.paintSurfacePerM1 ?? values.paintSurface ?? null,
    featuresQuality: values.featuresQuality || null,
    weightTheoretical: derived.weightTheoretical ?? values.weightTheoretical,
    weightTrade: values.weightTrade,
    weightGerman: values.weightGerman,

    standardsQuality: values.standardsQuality || null,
    tolerance: values.tolerance || null,
    ce: values.ce || null,
    options: values.options ?? null,
    processedOption: values.processedOption || null,
    sourceProduct: values.sourceProduct || null,
    industryNumber: values.industryNumber || null,

    purchasingUnit: values.purchasingUnit || null,
    unitPrice: values.unitPrice || null,
    deliveryTime: values.deliveryTime,
    deliveryTimeUnit: values.deliveryTimeUnit || null,
    orderSeries: values.orderSeries,
    blockedForPurchasing: values.blockedForPurchasing,
    makingOrderAdvices: values.makingOrderAdvices,
    orderingAdviceNotes: values.orderingAdviceNotes || null,
    productCodeOnPurchase: values.productCodeOnPurchase,
    maxLineQty: values.maxLineQty,
    maxNetPrice: values.maxNetPrice,

    packagingMandatoryOnCompletion: values.packagingMandatoryOnCompletion,
    receiptInLocationsWithLimitedDimensions:
      values.receiptInLocationsWithLimitedDimensions,
    goodsReceiptTerm: values.goodsReceiptTerm,
    includeInCsvForStockLabels: values.includeInCsvForStockLabels,
    suggestLastUsedChargeInScanner: values.suggestLastUsedChargeInScanner,
    stockLabelType: values.stockLabelType || null,
    stockLabelPrinting: values.stockLabelPrinting || null,
    toleranceUnloadingQty: values.toleranceUnloadingQty,
    toleranceUnloadingKg: values.toleranceUnloadingKg,
    toleranceCountQty: values.toleranceCountQty,
    toleranceCountKg: values.toleranceCountKg,
    tolerancePickingQty: values.tolerancePickingQty,
    tolerancePickingKg: values.tolerancePickingKg,
    toleranceProductionQty: values.toleranceProductionQty,
    toleranceProductionKg: values.toleranceProductionKg,
    customerLabelForPickingSlip: values.customerLabelForPickingSlip || null,
    customerLabelForSawingSlip: values.customerLabelForSawingSlip || null,
    customerLabelAtSurfTreatSlip: values.customerLabelAtSurfTreatSlip || null,
    alwaysApproveManuallyWarehouseWorkorderLine:
      values.alwaysApproveManuallyWarehouseWorkorderLine,
    alwaysApproveManuallyProductionWorkorderLine:
      values.alwaysApproveManuallyProductionWorkorderLine,

    minStockMode: values.minStockMode,
    minStockMultiplier: values.minStockMultiplier,
    minStockFixedValue: values.minStockFixedValue,
    minStockUnit: values.minStockUnit || null,
    maxStockMode: values.maxStockMode,
    maxStockMultiplier: values.maxStockMultiplier,
    maxStockFixedValue: values.maxStockFixedValue,
    maxStockUnit: values.maxStockUnit || null,
    leadTimeMethod: values.leadTimeMethod,
    leadTime: values.leadTime,
    reviewPeriod: values.reviewPeriod,
    orderCostsPurchasingSide: values.orderCostsPurchasingSide,
    orderCostsLogistics: values.orderCostsLogistics,
    stockOpOrderSeries: values.stockOpOrderSeries,
    minOrderQty: values.minOrderQty,
    useStockOpForThisProduct: values.useStockOpForThisProduct,
    orderOnMonday: values.orderOnMonday,
    orderOnTuesday: values.orderOnTuesday,
    orderOnWednesday: values.orderOnWednesday,
    orderOnThursday: values.orderOnThursday,
    orderOnFriday: values.orderOnFriday,
    capitalCost: values.capitalCost,
    warehouseCost: values.warehouseCost,
    b2StockoutPct1: values.b2StockoutPct1,
    b2StockoutPct2: values.b2StockoutPct2,
    handling: values.handling,
    transport: values.transport,
    pacClassification: values.pacClassification || null,
    orderAdviceCode: values.orderAdviceCode || null,

    revenueGroup,
    salesUnit: values.salesUnit || null,
    salesUnitPrice: values.salesUnitPrice || null,
    vatCode: values.vatCode || null,
    roundWeightPerPieceUp: values.roundWeightPerPieceUp,
    benorProduct: values.benorProduct,
    productCodeOnQuoteOrderInvoice: values.productCodeOnQuoteOrderInvoice,
    certificaat: values.certificaat || null,
    websiteExport: values.websiteExport,
    websiteBlockedForSales: values.websiteBlockedForSales,
    descriptionProductShort: values.descriptionProductShort,
    showWeightPerPiece: values.showWeightPerPiece,
    showPackagingPerPiece: values.showPackagingPerPiece,
    markProductGroup: values.markProductGroup,
    priceOnRequest: values.priceOnRequest,
    minProfitMarginStock: values.minProfitMarginStock,
    minProfitMarginExWorks: values.minProfitMarginExWorks,
    minProfitMarginCrossDocking: values.minProfitMarginCrossDocking,
    severalBlockedForSales: values.severalBlockedForSales,
    vehicleWithCraneRequired: values.vehicleWithCraneRequired,
    vehicleWithCanopyRequired: values.vehicleWithCanopyRequired,
    alwaysReserveStock: values.alwaysReserveStock,
    maxSalesLineQty: values.maxSalesLineQty,
    maxSalesNetPrice: values.maxSalesNetPrice,
    handlingCosts: values.handlingCosts,

    documents: values.documents ?? null,
  };
};

export const formValuesToProductGroupSuppliers = (
  suppliers: ProductGroupSupplierValues[],
): ProductGroupSupplierInput[] =>
  suppliers.map((supplier) => ({
    supplierCompanyUuid: supplier.supplierCompanyUuid,
    preferred: supplier.preferred,
    ean: supplier.ean || null,
    externalProductCode: supplier.externalProductCode || null,
    editing: supplier.editing || null,
    deliveryTime: supplier.deliveryTime,
    deliveryTimeUnit: supplier.deliveryTimeUnit || null,
    moq: supplier.moq,
    moqUnit: supplier.moqUnit || null,
    orderSeries: supplier.orderSeries,
    orderSeriesUnit: supplier.orderSeriesUnit || null,
  }));
