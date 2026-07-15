import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { orderItemStatuses } from "../../lib/enums";
import { Orders } from "./orders";
import { Stock } from "./stock";
import { Products } from "./products";

export const OrderItems = mysqlTable(
  "OrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderUuid: char("order_uuid", { length: 36 }).notNull(),
    stockUuid: char("stock_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    // Amount reserved from stockUuid — never changes after creation. Consumed
    // in full when invoiced, or released in full when cancelled.
    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    status: mysqlEnum("status", orderItemStatuses)
      .default("reserved")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_order_items_order_uuid").on(table.orderUuid),
    index("idx_order_items_stock_uuid").on(table.stockUuid),
    index("idx_order_items_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_order_items_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_order_items_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectOrderItems = InferSelectModel<typeof OrderItems>;
export type InsertOrderItems = InferInsertModel<typeof OrderItems>;
