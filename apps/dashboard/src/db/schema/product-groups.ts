import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
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
  customerLabelOptions,
  decimalPlacesOptions,
  deliveryTimeUnits,
  featuresQualities,
  leadTimeMethods,
  processedOptions,
  productQualityStandards,
  productShapes,
  purchasingUnits,
  revenueGroups,
  salesUnitOptions,
  stockLabelPrintingOptions,
  stockLabelTypes,
  stockModes,
  vatCodes,
} from "../../lib/enums";

export const ProductGroups = mysqlTable(
  "ProductGroups",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    parentUuid: char("parent_uuid", { length: 36 }),

    name: varchar("name", { length: 255 }).notNull(),
    productShape: mysqlEnum("product_shape", productShapes),

    groupLongDesc: text("group_long_desc"),
    groupShortDesc: varchar("group_short_desc", { length: 255 }),
    productShapeDesc: varchar("product_shape_desc", { length: 255 }),

    materialGroup: varchar("material_group", { length: 100 }),
    commodity: varchar("commodity", { length: 100 }),

    scrap: boolean("scrap").default(false),
    packaging: boolean("packaging").default(false),
    descSalesPurchaseOverridable: boolean(
      "desc_sales_purchase_overridable",
    ).default(false),

    searchCode1: varchar("search_code_1", { length: 100 }),
    searchCode2: varchar("search_code_2", { length: 100 }),
    searchCode3: varchar("search_code_3", { length: 100 }),

    articleGroup: mysqlEnum("article_group", articleGroups),

    // Dimensions (visible when product shape is selected)
    length: decimal("length", { precision: 10, scale: 2 }),
    width: decimal("width", { precision: 10, scale: 2 }),
    thickness: decimal("thickness", { precision: 10, scale: 2 }),

    // View features
    decimalPlaces: mysqlEnum("decimal_places", decimalPlacesOptions).default(
      "0",
    ),

    printDimensions: boolean("print_dimensions").default(false),

    // Features
    weight: decimal("weight", { precision: 10, scale: 4 }),
    paintSurface: decimal("paint_surface", { precision: 10, scale: 4 }),
    featuresQuality: mysqlEnum("features_quality", featuresQualities),

    // Weights
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

    // Standards
    standardsQuality: mysqlEnum("standards_quality", productQualityStandards),
    tolerance: mysqlEnum("tolerance", productQualityStandards),
    ce: mysqlEnum("ce", ceStandards),

    // Options (free list)
    options: json("options").$type<string[]>(),

    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    // Processed
    processedOption: mysqlEnum("processed_option", processedOptions),
    sourceProduct: varchar("source_product", { length: 255 }),

    // Industry
    industryNumber: varchar("industry_number", { length: 100 }),

    // Purchase
    purchasingUnit: mysqlEnum("purchasing_unit", purchasingUnits),
    unitPrice: mysqlEnum("unit_price", purchasingUnits),
    deliveryTime: int("delivery_time").default(0),
    deliveryTimeUnit: mysqlEnum("delivery_time_unit", deliveryTimeUnits),
    orderSeries: int("order_series").default(0),
    blockedForPurchasing: boolean("blocked_for_purchasing").default(false),
    makingOrderAdvices: boolean("making_order_advices").default(false),
    orderingAdviceNotes: varchar("ordering_advice_notes", { length: 500 }),
    productCodeOnPurchase: boolean("product_code_on_purchase").default(false),
    maxLineQty: decimal("max_line_qty", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    maxNetPrice: decimal("max_net_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // Warehouse Control - Receipt and Dispatch
    packagingMandatoryOnCompletion: boolean(
      "packaging_mandatory_on_completion",
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
    stockLabelPrinting: mysqlEnum(
      "stock_label_printing",
      stockLabelPrintingOptions,
    ),

    // Warehouse Control - Tolerances when reporting as completed (%)
    // 🔴 How far a report may stray from its plan, per workorder type.
    //
    // Read off `PK44115025125` on 2-10-2026: unloading 5/5, count 0/0, picking
    // 5/5, production —/0. Three different rules, and the differences carry the
    // meaning — a count must be exact or it is not a count, a production job
    // must close its kilo balance exactly, and a picking may be 5 % out.
    //
    // ⚠️ **Nullable on purpose.** The reference leaves production's quantity
    // cell *blank* and sets count's to *0 %*, and those are not the same thing:
    // blank is no rule, zero is the strictest rule there is. A default of
    // `0.00` would collapse the two and refuse every honest picking.
    toleranceUnloadingQty: decimal("tolerance_unloading_qty", {
      precision: 5,
      scale: 2,
    }),
    toleranceUnloadingKg: decimal("tolerance_unloading_kg", {
      precision: 5,
      scale: 2,
    }),
    toleranceCountQty: decimal("tolerance_count_qty", {
      precision: 5,
      scale: 2,
    }),
    toleranceCountKg: decimal("tolerance_count_kg", {
      precision: 5,
      scale: 2,
    }),
    tolerancePickingQty: decimal("tolerance_picking_qty", {
      precision: 5,
      scale: 2,
    }),
    tolerancePickingKg: decimal("tolerance_picking_kg", {
      precision: 5,
      scale: 2,
    }),
    toleranceProductionQty: decimal("tolerance_production_qty", {
      precision: 5,
      scale: 2,
    }),
    toleranceProductionKg: decimal("tolerance_production_kg", {
      precision: 5,
      scale: 2,
    }),
    // Warehouse Control - Customer Labels
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

    // Warehouse Control - Always Approve Manually
    alwaysApproveManuallyWarehouseWorkorderLine: boolean(
      "always_approve_manually_warehouse_wo_line",
    ).default(false),
    alwaysApproveManuallyProductionWorkorderLine: boolean(
      "always_approve_manually_production_wo_line",
    ).default(false),

    // Sales
    revenueGroup: mysqlEnum("revenue_group", revenueGroups),

    // Sales - General
    salesUnit: mysqlEnum("sales_unit", salesUnitOptions),
    salesUnitPrice: mysqlEnum("sales_unit_price", purchasingUnits),
    vatCode: mysqlEnum("vat_code", vatCodes),
    roundWeightPerPieceUp: boolean("round_weight_per_piece_up").default(false),
    benorProduct: boolean("benor_product").default(false),
    productCodeOnQuoteOrderInvoice: boolean(
      "product_code_on_quote_order_invoice",
    ).default(false),
    certificaat: mysqlEnum("certificaat", certificaatOptions),

    // Sales - Website
    websiteExport: boolean("website_export").default(false),
    websiteBlockedForSales: boolean("website_blocked_for_sales").default(false),
    descriptionProductShort: boolean("description_product_short").default(
      false,
    ),
    showWeightPerPiece: boolean("show_weight_per_piece").default(false),
    showPackagingPerPiece: boolean("show_packaging_per_piece").default(false),
    markProductGroup: boolean("mark_product_group").default(false),
    priceOnRequest: boolean("price_on_request").default(false),

    // Sales - Minimum profit margins (%)
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
    // Sales - Several
    severalBlockedForSales: boolean("several_blocked_for_sales").default(false),
    vehicleWithCraneRequired: boolean("vehicle_with_crane_required").default(
      false,
    ),
    vehicleWithCanopyRequired: boolean("vehicle_with_canopy_required").default(
      false,
    ),
    // 🔴 Whether an order line holds the lot it names. Ticked on every product
    // anybody has opened, and defaulted on here deliberately: the cost of
    // failing to hold metal is selling it twice.
    alwaysReserveStock: boolean("always_reserve_stock").default(true),
    // Sales - Order
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
    // Stock Policy - Minimum Stock
    minStockMode: mysqlEnum("min_stock_mode", stockModes).default("multiplier"),
    minStockMultiplier: decimal("min_stock_multiplier", {
      precision: 10,
      scale: 2,
    }).default("1.00"),
    minStockFixedValue: decimal("min_stock_fixed_value", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    minStockUnit: varchar("min_stock_unit", { length: 50 }),

    // Stock Policy - Maximum Stock
    maxStockMode: mysqlEnum("max_stock_mode", stockModes).default("multiplier"),
    maxStockMultiplier: decimal("max_stock_multiplier", {
      precision: 10,
      scale: 2,
    }).default("3.00"),
    maxStockFixedValue: decimal("max_stock_fixed_value", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    maxStockUnit: varchar("max_stock_unit", { length: 50 }),

    // StockOp Parameters
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
    minOrderQty: decimal("min_order_qty", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    // StockOn Order Parameters
    useStockOpForThisProduct: boolean("use_stock_op_for_this_product").default(
      false,
    ),
    // StockOn Ordering/Evaluation days
    orderOnMonday: boolean("order_on_monday").default(true),
    orderOnTuesday: boolean("order_on_tuesday").default(true),
    orderOnWednesday: boolean("order_on_wednesday").default(true),
    orderOnThursday: boolean("order_on_thursday").default(true),
    orderOnFriday: boolean("order_on_friday").default(true),

    // StockOp Simulation Parameters
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
    // PAC / Order advice
    pacClassification: varchar("pac_classification", { length: 10 }),
    orderAdviceCode: varchar("order_advice_code", { length: 10 }),

    // Suppliers live in the ProductGroupSuppliers table (one row per supplier,
    // one flagged preferred).

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_groups_parent_uuid").on(table.parentUuid),
    foreignKey({
      name: "fk_product_groups_parent",
      columns: [table.parentUuid],
      foreignColumns: [table.uuid],
    }),
  ],
);

export type SelectProductGroups = InferSelectModel<typeof ProductGroups>;
export type InsertProductGroups = InferInsertModel<typeof ProductGroups>;
