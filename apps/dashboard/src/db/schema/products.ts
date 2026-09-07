import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  articleGroups,
  ceStandards,
  certificaatOptions,
  countStockBases,
  customerLabelOptions,
  decimalPlacesOptions,
  deliveryTimeUnits,
  dispatchStrategies,
  featuresQualities,
  leadTimeMethods,
  processedOptions,
  productDimensionShapes,
  productQualityStandards,
  purchasingUnits,
  salesUnitOptions,
  stockLabelBreakdowns,
  stockLabelTypes,
  stockModes,
  vatCodes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { ProductGroups } from "./product-groups";
import { RevenueGroups } from "./revenue-groups";

export const Products = mysqlTable(
  "Products",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productCode: varchar("product_code", { length: 100 }).notNull(),
    // The code this product carried in the predecessor system — printed
    // alongside the current code on the price overviews so buyers can still
    // find an article by the number they know it as.
    oldProductCode: varchar("old_product_code", { length: 100 }),
    commodityCode: varchar("commodity_code", { length: 100 }),
    productGroupUuid: char("product_group_uuid", { length: 36 }),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),

    stockProduct: boolean("stock_product").default(false),
    standardProduct: boolean("standard_product").default(false),
    // A group product is priced and ordered as the whole product group rather
    // than as this single article.
    groupProduct: boolean("group_product").default(false),

    length: decimal("length", { precision: 10, scale: 2 }),
    widthDiameter: decimal("width_diameter", { precision: 10, scale: 2 }),
    thickness: decimal("thickness", { precision: 10, scale: 2 }),

    technicalStock: decimal("technical_stock", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    stockUnit: mysqlEnum("stock_unit", salesUnitOptions),

    theoreticalWeight: decimal("theoretical_weight", {
      precision: 15,
      scale: 4,
    }).default("0.0000"),
    weightUnit: mysqlEnum("weight_unit", salesUnitOptions),

    // ── Sales prices ──────────────────────────────────────────────────────────
    // Only what the article is sold for lives here. What it costs to buy is not
    // a property of the product — it is whatever a supplier billed — so every
    // purchase figure is read back from the purchase invoices instead
    // (`lib/server/purchase-pricing.ts`).
    //
    // The unit every price below is quoted per (kg, tonne, piece, ...).
    priceUnit: mysqlEnum("price_unit", salesUnitOptions),

    // The list price a customer is quoted before any contract discount.
    // Recalculated from the invoiced purchase price and the markup percentage.
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    // Percentage added to the invoiced purchase price to reach the base price.
    markup: decimal("markup", { precision: 6, scale: 2 }).default("0.00"),
    // Fixed sales price: when set, it overrides the calculated base price.
    fixedSalesPrice: decimal("fixed_sales_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    orderAdviceCode: varchar("order_advice_code", { length: 100 }),
    // When the price set above was last recalculated.
    priceDate: date("price_date", { mode: "string" }),

    // Company-specific product (customer or supplier role) — set when this
    // product was created for a specific company (e.g. from the "Products"
    // step of company creation) rather than being a general catalog item.
    companyUuid: char("company_uuid", { length: 36 }),
    preferred: boolean("preferred").default(false),
    ean: varchar("ean", { length: 100 }),
    externalProductCode: varchar("external_product_code", { length: 100 }),
    editing: varchar("editing", { length: 100 }),
    deliveryTime: int("delivery_time").default(0),
    deliveryTimeUnit: mysqlEnum("delivery_time_unit", deliveryTimeUnits),
    minOrderQty: decimal("min_order_qty", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    minOrderQtyUnit: mysqlEnum("min_order_qty_unit", purchasingUnits),
    orderSeries: int("order_series").default(0),
    orderSeriesUnit: mysqlEnum("order_series_unit", purchasingUnits),
    // Customer-specific products: whether this company-scoped product
    // should be shown on that customer's website/portal.
    showOnWebsite: boolean("show_on_website").default(false),

    // ── Identity ──────────────────────────────────────────────────────────────
    // The product screen repeats much of the product group's setup because a
    // group only supplies the defaults: a single article can be blocked, priced
    // or counted differently from the rest of its group, and these columns are
    // where that divergence is recorded.
    priceGroup: varchar("price_group", { length: 100 }),
    materialGroup: varchar("material_group", { length: 100 }),
    scrap: boolean("scrap").default(false),
    packaging: boolean("packaging").default(false),
    descSalesPurchaseOverridable: boolean(
      "desc_sales_purchase_overridable",
    ).default(false),
    searchCode1: varchar("search_code_1", { length: 100 }),
    searchCode2: varchar("search_code_2", { length: 100 }),
    searchCode3: varchar("search_code_3", { length: 100 }),
    articleGroup: mysqlEnum("article_group", articleGroups),

    // ── Descriptions ──────────────────────────────────────────────────────────
    groupLongDesc: text("group_long_desc"),
    groupShortDesc: varchar("group_short_desc", { length: 255 }),
    productShortDesc: varchar("product_short_desc", { length: 255 }),

    // Free-form selection codes used to filter the catalogue.
    selectionCodes: json("selection_codes").$type<string[]>(),

    // ── Basis ─────────────────────────────────────────────────────────────────
    dimensionShape: mysqlEnum("dimension_shape", productDimensionShapes),
    tradeLength: decimal("trade_length", { precision: 10, scale: 2 }).default(
      "0.00",
    ),
    tradeLengthFixed: boolean("trade_length_fixed").default(false),
    overlength: decimal("overlength", { precision: 10, scale: 2 }).default(
      "0.00",
    ),
    // Weight per running metre and paintable surface per running metre — both
    // derived from the cross-section, which is why the reference shows them
    // read-only.
    weightPerM1: decimal("weight_per_m1", { precision: 10, scale: 4 }).default(
      "0.0000",
    ),
    paintSurfacePerM1: decimal("paint_surface_per_m1", {
      precision: 10,
      scale: 4,
    }).default("0.0000"),
    featuresQuality: mysqlEnum("features_quality", featuresQualities),

    decimalPlaces: mysqlEnum("decimal_places", decimalPlacesOptions).default(
      "0",
    ),
    printDimensions: boolean("print_dimensions").default(false),

    // The density every derived weight is computed from, in kg/dm3.
    //
    // The reference keeps one per product and shows 7,850 for a 316L plate,
    // where our grade table maps 316 to 8,000 — which makes that plate 64,0 kg
    // instead of 62,8, out by 1,9 %. Set this and the product's own figure
    // wins; leave it null and the grade still decides, as before.
    densityKgDm3: decimal("density_kg_dm3", { precision: 6, scale: 3 }),

    weightTheoretical: decimal("weight_theoretical", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    weightTrade: decimal("weight_trade", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    weightGerman: decimal("weight_german", { precision: 15, scale: 3 }).default(
      "0.000",
    ),

    standardsQuality: mysqlEnum("standards_quality", productQualityStandards),
    tolerance: mysqlEnum("tolerance", productQualityStandards),
    ce: mysqlEnum("ce", ceStandards),

    options: json("options").$type<string[]>(),
    processedOption: mysqlEnum("processed_option", processedOptions),
    sourceProductUuid: char("source_product_uuid", { length: 36 }),
    industryNumber: varchar("industry_number", { length: 100 }),

    // ── Classification features ───────────────────────────────────────────────
    // Held as free text rather than enums: the reference's dropdowns were all
    // empty in the screens these were built from, so the option lists are not
    // known yet. Swapping them to mysqlEnum later is a column change only.
    classificationMaterial: varchar("classification_material", { length: 100 }),
    classificationQualityGroup: varchar("classification_quality_group", {
      length: 100,
    }),
    classificationMainShape: varchar("classification_main_shape", {
      length: 100,
    }),
    classificationSubShape: varchar("classification_sub_shape", {
      length: 100,
    }),
    classificationProcedure: varchar("classification_procedure", {
      length: 100,
    }),
    classificationAppearance: varchar("classification_appearance", {
      length: 100,
    }),
    classificationPerformance: varchar("classification_performance", {
      length: 100,
    }),

    // ── Purchase ──────────────────────────────────────────────────────────────
    purchasingUnit: mysqlEnum("purchasing_unit", purchasingUnits),
    unitPrice: mysqlEnum("unit_price", purchasingUnits),
    blockedForPurchasing: boolean("blocked_for_purchasing").default(false),
    makingOrderAdvices: boolean("making_order_advices").default(false),
    visibleInProductionSchedule: boolean(
      "visible_in_production_schedule",
    ).default(false),
    orderingAdviceNotes: varchar("ordering_advice_notes", { length: 500 }),
    productCodeOnPurchase: boolean("product_code_on_purchase").default(false),
    maxLineQty: decimal("max_line_qty", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    maxNetPrice: decimal("max_net_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // ── Sales ─────────────────────────────────────────────────────────────────
    salesUnit: mysqlEnum("sales_unit", salesUnitOptions),
    salesUnitPrice: mysqlEnum("sales_unit_price", purchasingUnits),
    vatCode: mysqlEnum("vat_code", vatCodes),
    roundWeightPerPieceUp: boolean("round_weight_per_piece_up").default(false),
    benorProduct: boolean("benor_product").default(false),
    productCodeOnQuoteOrderInvoice: boolean(
      "product_code_on_quote_order_invoice",
    ).default(false),
    certificaat: mysqlEnum("certificaat", certificaatOptions),

    websiteExport: boolean("website_export").default(false),
    websiteBlockedForSales: boolean("website_blocked_for_sales").default(false),
    descriptionProductShort: boolean("description_product_short").default(
      false,
    ),
    showWeightPerPiece: boolean("show_weight_per_piece").default(false),
    showPackagingPerPiece: boolean("show_packaging_per_piece").default(false),
    markProductGroup: boolean("mark_product_group").default(false),
    priceOnRequest: boolean("price_on_request").default(false),

    minProfitMarginStock: decimal("min_profit_margin_stock", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    minProfitMarginExWorks: decimal("min_profit_margin_ex_works", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    minProfitMarginCrossDocking: decimal("min_profit_margin_cross_docking", {
      precision: 5,
      scale: 2,
    }).default("0.00"),

    severalBlockedForSales: boolean("several_blocked_for_sales").default(false),
    vehicleWithCraneRequired: boolean("vehicle_with_crane_required").default(
      false,
    ),
    vehicleWithCanopyRequired: boolean("vehicle_with_canopy_required").default(
      false,
    ),
    alwaysReserveStock: boolean("always_reserve_stock").default(false),
    maxSalesLineQty: decimal("max_sales_line_qty", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    maxSalesNetPrice: decimal("max_sales_net_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    handlingCosts: decimal("handling_costs", {
      precision: 15,
      scale: 2,
    }).default("0.00"),

    // ── Warehouse control ─────────────────────────────────────────────────────
    packagingMandatoryOnCompletion: boolean(
      "packaging_mandatory_on_completion",
    ).default(false),
    unloadingWorkorderInStockUnit: boolean(
      "unloading_workorder_in_stock_unit",
    ).default(false),
    receiptInLocationsWithLimitedDimensions: boolean(
      "receipt_in_locations_with_limited_dimensions",
    ).default(false),
    goodsReceiptTerm: int("goods_receipt_term").default(0),
    includeInCsvForStockLabels: boolean(
      "include_in_csv_for_stock_labels",
    ).default(false),
    suggestLastUsedChargeInScanner: boolean(
      "suggest_last_used_charge_in_scanner",
    ).default(false),
    stockLabelType: mysqlEnum("stock_label_type", stockLabelTypes),
    stockLabelBreakdown: mysqlEnum(
      "stock_label_breakdown",
      stockLabelBreakdowns,
    ).default("per_line_bundle"),
    stockLabelPieces: int("stock_label_pieces").default(1),

    toleranceUnloadingQty: decimal("tolerance_unloading_qty", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    toleranceUnloadingKg: decimal("tolerance_unloading_kg", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    toleranceCountQty: decimal("tolerance_count_qty", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    toleranceCountKg: decimal("tolerance_count_kg", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    tolerancePickingQty: decimal("tolerance_picking_qty", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    tolerancePickingKg: decimal("tolerance_picking_kg", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    toleranceProductionQty: decimal("tolerance_production_qty", {
      precision: 5,
      scale: 2,
    }).default("0.00"),

    customerLabelForPickingSlip: mysqlEnum(
      "customer_label_picking_slip",
      customerLabelOptions,
    ),
    customerLabelForSawingSlip: mysqlEnum(
      "customer_label_sawing_slip",
      customerLabelOptions,
    ),
    customerLabelAtSurfTreatSlip: mysqlEnum(
      "customer_label_surf_treat_slip",
      customerLabelOptions,
    ),
    alwaysApproveManuallyWarehouseWorkorderLine: boolean(
      "always_approve_manually_warehouse_wo_line",
    ).default(false),
    alwaysApproveManuallyProductionWorkorderLine: boolean(
      "always_approve_manually_production_wo_line",
    ).default(false),

    // ── Stock policy ──────────────────────────────────────────────────────────
    minStockMode: mysqlEnum("min_stock_mode", stockModes).default("multiplier"),
    minStockMultiplier: decimal("min_stock_multiplier", {
      precision: 10,
      scale: 2,
    }).default("1.00"),
    minStockFixedValue: decimal("min_stock_fixed_value", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    maxStockMode: mysqlEnum("max_stock_mode", stockModes).default("multiplier"),
    maxStockMultiplier: decimal("max_stock_multiplier", {
      precision: 10,
      scale: 2,
    }).default("3.00"),
    maxStockFixedValue: decimal("max_stock_fixed_value", {
      precision: 15,
      scale: 3,
    }).default("0.000"),

    leadTimeMethod: mysqlEnum("lead_time_method", leadTimeMethods).default(
      "manually",
    ),
    leadTime: int("lead_time").default(0),
    reviewPeriod: int("review_period").default(0),
    orderCostsPurchasingSide: decimal("order_costs_purchasing_side", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    orderCostsLogistics: decimal("order_costs_logistics", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    stockOpOrderSeries: decimal("stock_op_order_series", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    useStockOpForThisProduct: boolean("use_stock_op_for_this_product").default(
      false,
    ),
    orderOnMonday: boolean("order_on_monday").default(true),
    orderOnTuesday: boolean("order_on_tuesday").default(true),
    orderOnWednesday: boolean("order_on_wednesday").default(true),
    orderOnThursday: boolean("order_on_thursday").default(true),
    orderOnFriday: boolean("order_on_friday").default(true),

    capitalCost: decimal("capital_cost", { precision: 10, scale: 4 }).default(
      "0.0000",
    ),
    warehouseCost: decimal("warehouse_cost", {
      precision: 10,
      scale: 4,
    }).default("0.0000"),
    b2StockoutPct1: decimal("b2_stockout_pct1", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    b2StockoutPct2: decimal("b2_stockout_pct2", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    handling: decimal("handling", { precision: 10, scale: 4 }).default(
      "0.0000",
    ),
    transport: decimal("transport", { precision: 10, scale: 4 }).default(
      "0.0000",
    ),
    pacClassification: varchar("pac_classification", { length: 10 }),

    // ── Stock control ─────────────────────────────────────────────────────────
    scrapProductUuid: char("scrap_product_uuid", { length: 36 }),
    transferProductUuid: char("transfer_product_uuid", { length: 36 }),
    packagingProductUuid: char("packaging_product_uuid", { length: 36 }),
    cdLocationUuid: char("cd_location_uuid", { length: 36 }),
    stockProductSince: date("stock_product_since", { mode: "string" }),

    batchRegistration: boolean("batch_registration").default(false),
    batchRegisterLength: boolean("batch_register_length").default(false),
    batchLengthMinimum: decimal("batch_length_minimum", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    batchLengthInterval: decimal("batch_length_interval", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    // Remainders under this many mm are dropped when a length is divided into
    // interval steps, so a near-miss offcut is not registered as its own piece.
    batchLengthRemainderTolerance: decimal("batch_length_remainder_tolerance", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    batchRegisterWidth: boolean("batch_register_width").default(false),
    batchWidthMinimum: decimal("batch_width_minimum", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    batchWidthInterval: decimal("batch_width_interval", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    batchUseOptimization: boolean("batch_use_optimization").default(false),
    batchCharge: boolean("batch_charge").default(false),
    batchDispatchStrategy: mysqlEnum(
      "batch_dispatch_strategy",
      dispatchStrategies,
    ).default("lifo"),
    batchDoNotSplitPerBatch: boolean("batch_do_not_split_per_batch").default(
      false,
    ),
    batchPlateNumber: boolean("batch_plate_number").default(false),
    batchPerPiece: boolean("batch_per_piece").default(false),
    batchNumber: boolean("batch_number").default(false),

    countFrequency: int("count_frequency").default(0),
    countedThisYear: int("counted_this_year").default(0),
    lastCountDate: date("last_count_date", { mode: "string" }),
    nextCountTargetDate: date("next_count_target_date", { mode: "string" }),
    countStockBasis: mysqlEnum("count_stock_basis", countStockBases).default(
      "technical",
    ),
    countBelowQuantity: decimal("count_below_quantity", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    countBelowUnit: mysqlEnum("count_below_unit", salesUnitOptions),

    // ── Optimization criteria (sawing) ────────────────────────────────────────
    optTradeLengthTolerance: int("opt_trade_length_tolerance").default(0),
    optEndSpace: int("opt_end_space").default(0),
    optClamping: int("opt_clamping").default(0),
    optOffcutMinLength: int("opt_offcut_min_length").default(0),
    optOffcutPreferredMin: int("opt_offcut_preferred_min").default(0),
    optClampingEdge: int("opt_clamping_edge").default(0),
    // Weighting factors (0–999) the sawing optimiser balances against each
    // other when it chooses a cutting plan.
    optFactorBundles: int("opt_factor_bundles").default(0),
    optFactorPriorityLocationType: int(
      "opt_factor_priority_location_type",
    ).default(0),
    optFactorSawingCuts: int("opt_factor_sawing_cuts").default(0),
    optFactorCreatedOffcuts: int("opt_factor_created_offcuts").default(0),
    optFactorCreatedScrapPieces: int("opt_factor_created_scrap_pieces").default(
      0,
    ),
    optFactorUsedTradeLengths: int("opt_factor_used_trade_lengths").default(0),
    optFactorUsedOffcuts: int("opt_factor_used_offcuts").default(0),
    optFactorScrapPieceLength: int("opt_factor_scrap_piece_length").default(0),
    optFactorOffcutsBelowPreferred: int(
      "opt_factor_offcuts_below_preferred",
    ).default(0),
    optFactorLengthCutoffs: int("opt_factor_length_cutoffs").default(0),
    optAllowLongestOffcuts: boolean("opt_allow_longest_offcuts").default(false),

    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),
    remarks: text("remarks"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_products_product_group_uuid").on(table.productGroupUuid),
    // The catalogue is searched by code far more than anything else, and the
    // two flags decide whether an article can be sold from stock at all.
    index("idx_products_product_code").on(table.productCode),
    index("idx_products_article_group").on(table.articleGroup),
    index("idx_products_stock_product").on(table.stockProduct),
    index("idx_products_created_at_id").on(table.createdAt, table.id),
    index("idx_products_revenue_group_uuid").on(table.revenueGroupUuid),
    index("idx_products_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_products_product_group",
      columns: [table.productGroupUuid],
      foreignColumns: [ProductGroups.uuid],
    }),
    foreignKey({
      name: "fk_products_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
    foreignKey({
      name: "fk_products_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectProducts = InferSelectModel<typeof Products>;
export type InsertProducts = InferInsertModel<typeof Products>;
