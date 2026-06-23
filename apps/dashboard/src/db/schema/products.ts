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
import { salesUnitOptions } from "../../lib/enums";
import { ProductGroups } from "./product-groups";

export const Products = mysqlTable(
  "Products",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productCode: varchar("product_code", { length: 100 }).notNull(),
    commodityCode: varchar("commodity_code", { length: 100 }),
    productGroupUuid: char("product_group_uuid", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),

    stockProduct: boolean("stock_product").notNull().default(false),
    standardProduct: boolean("standard_product").notNull().default(false),

    length: decimal("length", { precision: 10, scale: 2 }),
    widthDiameter: decimal("width_diameter", { precision: 10, scale: 2 }),
    thickness: decimal("thickness", { precision: 10, scale: 2 }),

    technicalStock: decimal("technical_stock", { precision: 15, scale: 3 })
      .notNull()
      .default("0.000"),
    stockUnit: mysqlEnum("stock_unit", salesUnitOptions),

    theoreticalWeight: decimal("theoretical_weight", { precision: 15, scale: 4 })
      .notNull()
      .default("0.0000"),
    weightUnit: mysqlEnum("weight_unit", salesUnitOptions),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_products_product_group_uuid").on(table.productGroupUuid),
    foreignKey({
      name: "fk_products_product_group",
      columns: [table.productGroupUuid],
      foreignColumns: [ProductGroups.uuid],
    }),
  ],
);

export type SelectProducts = InferSelectModel<typeof Products>;
export type InsertProducts = InferInsertModel<typeof Products>;
