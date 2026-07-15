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
import { stockMovementTypes } from "../../lib/enums";
import { Products } from "./products";
import { Stock } from "./stock";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseInvoices } from "./purchase-invoices";

export const StockMovements = mysqlTable(
  "StockMovements",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    stockUuid: char("stock_uuid", { length: 36 }).notNull(),

    type: mysqlEnum("type", stockMovementTypes).notNull(),
    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),

    // Populated when type = "in" — stock entering from a purchase order.
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    // Populated when type = "out" — stock taken by a purchase invoice.
    purchaseInvoiceUuid: char("purchase_invoice_uuid", { length: 36 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_stock_movements_product_uuid").on(table.productUuid),
    index("idx_stock_movements_stock_uuid").on(table.stockUuid),
    index("idx_stock_movements_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_stock_movements_purchase_invoice_uuid").on(
      table.purchaseInvoiceUuid,
    ),
    foreignKey({
      name: "fk_stock_movements_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_purchase_invoice",
      columns: [table.purchaseInvoiceUuid],
      foreignColumns: [PurchaseInvoices.uuid],
    }),
  ],
);

export type SelectStockMovements = InferSelectModel<typeof StockMovements>;
export type InsertStockMovements = InferInsertModel<typeof StockMovements>;
