import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { PurchaseOrders } from "./purchase-orders";
import { Products } from "./products";

export const PurchaseOrderItems = mysqlTable(
  "PurchaseOrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_order_items_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_purchase_order_items_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_purchase_order_items_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_purchase_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectPurchaseOrderItems = InferSelectModel<
  typeof PurchaseOrderItems
>;
export type InsertPurchaseOrderItems = InferInsertModel<
  typeof PurchaseOrderItems
>;
