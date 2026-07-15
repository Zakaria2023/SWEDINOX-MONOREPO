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
import { stockStatuses } from "../../lib/enums";
import { Products } from "./products";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseOrderItems } from "./purchase-order-items";

export const Stock = mysqlTable(
  "Stock",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    purchaseOrderItemUuid: char("purchase_order_item_uuid", { length: 36 }),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    // How much of `quantity` is earmarked by open sales order reservations —
    // available to sell/invoice is always `quantity - reservedQuantity`.
    reservedQuantity: decimal("reserved_quantity", { precision: 15, scale: 3 })
      .default("0.000")
      .notNull(),
    status: mysqlEnum("status", stockStatuses).default("pending").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_stock_product_uuid").on(table.productUuid),
    index("idx_stock_purchase_order_uuid").on(table.purchaseOrderUuid),
    index("idx_stock_purchase_order_item_uuid").on(
      table.purchaseOrderItemUuid,
    ),
    foreignKey({
      name: "fk_stock_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_stock_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_stock_purchase_order_item",
      columns: [table.purchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }),
  ],
);

export type SelectStock = InferSelectModel<typeof Stock>;
export type InsertStock = InferInsertModel<typeof Stock>;
