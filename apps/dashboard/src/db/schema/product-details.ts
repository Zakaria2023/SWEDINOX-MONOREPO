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
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  deliveryTimeUnits,
  priceTierBases,
  purchasingUnits,
  salesUnitOptions,
  warehouseLocationTypes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { Warehouses } from "./warehouses";
import { Products } from "./products";

// A tier row in a price structure: from a threshold, a value applies. Kept as
// JSON on the structure rather than as its own table because a tier has no
// identity of its own — it is only ever read, written and replaced as part of
// the structure that owns it.
export type PriceTier = {
  from: string;
  value: string;
};

// ── Alternatives ────────────────────────────────────────────────────────────
// Products that may be supplied in place of this one. Directional: listing B
// under A does not imply A may be supplied for B, since a heavier or higher
// grade article often substitutes for a lighter one but not the reverse.
export const ProductAlternatives = mysqlTable(
  "ProductAlternatives",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    alternativeProductUuid: char("alternative_product_uuid", {
      length: 36,
    }).notNull(),
    description: varchar("description", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_alternatives_product_uuid").on(table.productUuid),
    index("idx_product_alternatives_alternative_uuid").on(
      table.alternativeProductUuid,
    ),
    foreignKey({
      name: "fk_product_alternatives_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_product_alternatives_alternative",
      columns: [table.alternativeProductUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

// ── Suppliers ───────────────────────────────────────────────────────────────
// Who this article can be bought from, and on what terms. One row may be
// flagged preferred — that is the supplier the order advice adopts.
export const ProductSuppliers = mysqlTable(
  "ProductSuppliers",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    supplierUuid: char("supplier_uuid", { length: 36 }).notNull(),

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
    orderSeries: decimal("order_series", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    orderSeriesUnit: mysqlEnum("order_series_unit", purchasingUnits),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_suppliers_product_uuid").on(table.productUuid),
    index("idx_product_suppliers_supplier_uuid").on(table.supplierUuid),
    foreignKey({
      name: "fk_product_suppliers_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_product_suppliers_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

// ── Preferred locations ─────────────────────────────────────────────────────
// Where this article is meant to live in the warehouse, in preference order,
// with the level at which a pick location is restocked from a bulk one.
export const ProductPreferredLocations = mysqlTable(
  "ProductPreferredLocations",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    locationUuid: char("location_uuid", { length: 36 }).notNull(),
    restockLocationUuid: char("restock_location_uuid", { length: 36 }),

    preference: int("preference").default(1),
    locationType: mysqlEnum("location_type", warehouseLocationTypes),
    restockLevel: decimal("restock_level", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    restockLevelUnit: mysqlEnum("restock_level_unit", salesUnitOptions),
    restockQty: decimal("restock_qty", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    restockQtyUnit: mysqlEnum("restock_qty_unit", salesUnitOptions),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_preferred_locations_product_uuid").on(table.productUuid),
    index("idx_product_preferred_locations_location_uuid").on(
      table.locationUuid,
    ),
    foreignKey({
      name: "fk_product_preferred_locations_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_product_preferred_locations_location",
      columns: [table.locationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
    foreignKey({
      name: "fk_product_preferred_locations_restock_location",
      columns: [table.restockLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

// ── Price structures ────────────────────────────────────────────────────────
// The material price for a product over a validity window. A new structure is
// opened with a starting date rather than editing the current one, so a price
// that applied in the past can still be reconstructed for an old order.
//
// The five tier grids are optional: each has an enable flag, because "no
// quantity surcharge" and "a quantity surcharge of zero" are different
// statements about how the article is sold.
export const ProductPriceStructures = mysqlTable(
  "ProductPriceStructures",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),

    validFrom: date("valid_from", { mode: "string" }).notNull(),
    validUntil: date("valid_until", { mode: "string" }),

    basePrice: decimal("base_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    markup: decimal("markup", { precision: 15, scale: 2 }).default("0.00"),
    scrap: decimal("scrap", { precision: 15, scale: 2 }).default("0.00"),
    priceUnit: mysqlEnum("price_unit", purchasingUnits),

    quantitySurchargeEnabled: boolean("quantity_surcharge_enabled").default(
      false,
    ),
    quantitySurchargeBasis: mysqlEnum(
      "quantity_surcharge_basis",
      priceTierBases,
    ),
    quantitySurchargeTiers: json("quantity_surcharge_tiers").$type<PriceTier[]>(),

    groupDiscountEnabled: boolean("group_discount_enabled").default(false),
    groupDiscountBasis: mysqlEnum("group_discount_basis", priceTierBases),
    groupDiscountTiers: json("group_discount_tiers").$type<PriceTier[]>(),

    lengthSurchargeEnabled: boolean("length_surcharge_enabled").default(false),
    lengthSurchargeTiers: json("length_surcharge_tiers").$type<PriceTier[]>(),

    qualitySurchargeEnabled: boolean("quality_surcharge_enabled").default(false),
    qualitySurchargeTiers: json("quality_surcharge_tiers").$type<PriceTier[]>(),

    lineDiscountEnabled: boolean("line_discount_enabled").default(false),
    lineDiscountTiers: json("line_discount_tiers").$type<PriceTier[]>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_price_structures_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_product_price_structures_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

// ── Sawing prices ───────────────────────────────────────────────────────────
// What cutting this article costs, over its own validity window. Mitre cuts
// carry a surcharge because they take longer and waste more material, and an
// uneven angle costs more again than a square or matched pair.
export const ProductSawingPrices = mysqlTable(
  "ProductSawingPrices",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),

    validFrom: date("valid_from", { mode: "string" }).notNull(),
    validUntil: date("valid_until", { mode: "string" }),

    basePrice: decimal("base_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceUnit: mysqlEnum("price_unit", purchasingUnits),
    mitreSurchargeEvenPct: decimal("mitre_surcharge_even_pct", {
      precision: 5,
      scale: 2,
    }).default("0.00"),
    mitreSurchargeUnevenPct: decimal("mitre_surcharge_uneven_pct", {
      precision: 5,
      scale: 2,
    }).default("0.00"),

    quantityDiscountEnabled: boolean("quantity_discount_enabled").default(false),
    quantityDiscountTiers: json("quantity_discount_tiers").$type<PriceTier[]>(),

    lengthSurchargeEnabled: boolean("length_surcharge_enabled").default(false),
    lengthSurchargeTiers: json("length_surcharge_tiers").$type<PriceTier[]>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_sawing_prices_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_product_sawing_prices_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

// ── Valuation history ───────────────────────────────────────────────────────
// Every average-purchase-price the article has carried. Written rather than
// overwritten so a stock valuation taken last quarter can still be explained.
export const ProductAppHistory = mysqlTable(
  "ProductAppHistory",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),

    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    averagePurchasePrice: decimal("average_purchase_price", {
      precision: 15,
      scale: 5,
    }).default("0.00000"),
    reference: varchar("reference", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_app_history_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_product_app_history_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

// Every fixed settlement price the article has been valued at, with the stock
// position at the moment it changed — that is what makes a revaluation
// reproducible after the fact.
export const ProductFspHistory = mysqlTable(
  "ProductFspHistory",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),

    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    fsp: decimal("fsp", { precision: 15, scale: 5 }).default("0.00000"),
    replacementPrice: decimal("replacement_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    fictitiousOrderQuantity: decimal("fictitious_order_quantity", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    internalSurcharge: decimal("internal_surcharge", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    internalSurchargeUnit: mysqlEnum(
      "internal_surcharge_unit",
      purchasingUnits,
    ),
    externalSurcharge: decimal("external_surcharge", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    externalSurchargeUnit: mysqlEnum(
      "external_surcharge_unit",
      purchasingUnits,
    ),
    stockQuantity: decimal("stock_quantity", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    stockUnit: mysqlEnum("stock_unit", salesUnitOptions),
    stockKg: decimal("stock_kg", { precision: 15, scale: 2 }).default("0.00"),
    priceUnit: mysqlEnum("price_unit", purchasingUnits),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_fsp_history_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_product_fsp_history_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectProductAlternatives = InferSelectModel<
  typeof ProductAlternatives
>;
export type InsertProductAlternatives = InferInsertModel<
  typeof ProductAlternatives
>;
export type SelectProductSuppliers = InferSelectModel<typeof ProductSuppliers>;
export type InsertProductSuppliers = InferInsertModel<typeof ProductSuppliers>;
export type SelectProductPreferredLocations = InferSelectModel<
  typeof ProductPreferredLocations
>;
export type InsertProductPreferredLocations = InferInsertModel<
  typeof ProductPreferredLocations
>;
export type SelectProductPriceStructures = InferSelectModel<
  typeof ProductPriceStructures
>;
export type InsertProductPriceStructures = InferInsertModel<
  typeof ProductPriceStructures
>;
export type SelectProductSawingPrices = InferSelectModel<
  typeof ProductSawingPrices
>;
export type InsertProductSawingPrices = InferInsertModel<
  typeof ProductSawingPrices
>;
export type SelectProductAppHistory = InferSelectModel<typeof ProductAppHistory>;
export type InsertProductAppHistory = InferInsertModel<typeof ProductAppHistory>;
export type SelectProductFspHistory = InferSelectModel<typeof ProductFspHistory>;
export type InsertProductFspHistory = InferInsertModel<typeof ProductFspHistory>;
