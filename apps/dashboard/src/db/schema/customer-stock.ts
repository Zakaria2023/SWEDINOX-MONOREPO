import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { customerStockReasons } from "../../lib/enums";
import { Companies } from "./companies";
import { Products } from "./products";

// Stock a customer keeps booked at one of our locations. `productCode` and
// `productName` are snapshotted from the picked catalog product so the grid
// stays readable even if the catalog product changes later.
export const CustomerStock = mysqlTable(
  "CustomerStock",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    location: varchar("location", { length: 255 }),
    productUuid: char("product_uuid", { length: 36 }),
    productCode: varchar("product_code", { length: 255 }),
    productName: varchar("product_name", { length: 255 }),
    quantity: decimal("quantity", { precision: 12, scale: 3 }).default("0.000"),
    reason: mysqlEnum("reason", customerStockReasons),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_customer_stock_company_uuid").on(table.companyUuid),
    index("idx_customer_stock_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_customer_stock_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_customer_stock_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectCustomerStock = InferSelectModel<typeof CustomerStock>;
export type InsertCustomerStock = InferInsertModel<typeof CustomerStock>;
