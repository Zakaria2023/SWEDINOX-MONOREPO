import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  deliveryTimeUnits,
  purchasingUnits,
  salesUnitOptions,
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
    commodityCode: varchar("commodity_code", { length: 100 }),
    productGroupUuid: char("product_group_uuid", { length: 36 }),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),

    stockProduct: boolean("stock_product").default(false),
    standardProduct: boolean("standard_product").default(false),

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

    // Current replacement (re-purchase) price — compared against what was
    // actually paid on the "Purchase results" report.
    replacementPrice: decimal("replacement_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),

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

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_products_product_group_uuid").on(table.productGroupUuid),
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
