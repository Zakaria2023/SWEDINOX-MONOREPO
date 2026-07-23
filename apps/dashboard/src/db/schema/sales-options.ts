import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { processingEditings, salesUnitOptions } from "../../lib/enums";
import { Products } from "./products";
import { RevenueGroups } from "./revenue-groups";

// A processing step that can be sold alongside the material — sawing, bending,
// polishing and so on. `code` is the short letter the grids print (e.g. "S" for
// sawing); `editing` ties the option to the processing type a supplier
// performs, so an option can be matched to the processors that offer it.
export const SalesOptions = mysqlTable(
  "SalesOptions",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    code: varchar("code", { length: 10 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    editing: mysqlEnum("editing", processingEditings),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),

    // What the option is charged and costs per price unit. A product without
    // its own option price falls back to these.
    priceUnit: mysqlEnum("price_unit", salesUnitOptions),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_sales_options_revenue_group_uuid").on(table.revenueGroupUuid),
    foreignKey({
      name: "fk_sales_options_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
  ],
);

// What one option costs on one product, for a validity window. Backs the
// "Option prices per product" overview.
export const ProductOptionPrices = mysqlTable(
  "ProductOptionPrices",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    optionUuid: char("option_uuid", { length: 36 }).notNull(),

    priceUnit: mysqlEnum("price_unit", salesUnitOptions),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    validFrom: date("valid_from", { mode: "string" }),
    validUntil: date("valid_until", { mode: "string" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_option_prices_product_uuid").on(table.productUuid),
    index("idx_product_option_prices_option_uuid").on(table.optionUuid),
    foreignKey({
      name: "fk_product_option_prices_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_product_option_prices_option",
      columns: [table.optionUuid],
      foreignColumns: [SalesOptions.uuid],
    }),
  ],
);

export type SelectSalesOptions = InferSelectModel<typeof SalesOptions>;
export type InsertSalesOptions = InferInsertModel<typeof SalesOptions>;
export type SelectProductOptionPrices = InferSelectModel<
  typeof ProductOptionPrices
>;
export type InsertProductOptionPrices = InferInsertModel<
  typeof ProductOptionPrices
>;
