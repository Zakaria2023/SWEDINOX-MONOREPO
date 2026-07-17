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
import { deliveryTimeUnits, purchasingUnits } from "../../lib/enums";
import { Companies } from "./companies";
import { ProductGroups } from "./product-groups";

// The suppliers that can deliver a product group, one row per supplier. Exactly
// one row per group is flagged `preferred` — that supplier's lead time, MOQ and
// order series drive the purchasing/order-advice logic.
export const ProductGroupSuppliers = mysqlTable(
  "ProductGroupSuppliers",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productGroupUuid: char("product_group_uuid", { length: 36 }).notNull(),
    // A Companies row holding the "supplier" role.
    supplierCompanyUuid: char("supplier_company_uuid", { length: 36 }).notNull(),

    preferred: boolean("preferred").default(false).notNull(),
    ean: varchar("ean", { length: 100 }),
    externalProductCode: varchar("external_product_code", { length: 100 }),
    editing: varchar("editing", { length: 100 }),

    deliveryTime: int("delivery_time").default(0),
    deliveryTimeUnit: mysqlEnum("delivery_time_unit", deliveryTimeUnits),
    moq: decimal("moq", { precision: 15, scale: 3 }).default("0.000"),
    moqUnit: mysqlEnum("moq_unit", purchasingUnits),
    orderSeries: int("order_series").default(0),
    orderSeriesUnit: mysqlEnum("order_series_unit", purchasingUnits),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_product_group_suppliers_product_group_uuid").on(
      table.productGroupUuid,
    ),
    index("idx_product_group_suppliers_supplier_company_uuid").on(
      table.supplierCompanyUuid,
    ),
    foreignKey({
      name: "fk_product_group_suppliers_product_group",
      columns: [table.productGroupUuid],
      foreignColumns: [ProductGroups.uuid],
    }),
    foreignKey({
      name: "fk_product_group_suppliers_supplier_company",
      columns: [table.supplierCompanyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectProductGroupSuppliers = InferSelectModel<
  typeof ProductGroupSuppliers
>;
export type InsertProductGroupSuppliers = InferInsertModel<
  typeof ProductGroupSuppliers
>;
