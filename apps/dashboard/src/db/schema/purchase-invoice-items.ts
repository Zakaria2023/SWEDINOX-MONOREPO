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
import { PurchaseInvoices } from "./purchase-invoices";
import { Stock } from "./stock";
import { Products } from "./products";

export const PurchaseInvoiceItems = mysqlTable(
  "PurchaseInvoiceItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseInvoiceUuid: char("purchase_invoice_uuid", { length: 36 }).notNull(),
    stockUuid: char("stock_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_invoice_items_purchase_invoice_uuid").on(
      table.purchaseInvoiceUuid,
    ),
    index("idx_purchase_invoice_items_stock_uuid").on(table.stockUuid),
    index("idx_purchase_invoice_items_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_purchase_invoice_items_purchase_invoice",
      columns: [table.purchaseInvoiceUuid],
      foreignColumns: [PurchaseInvoices.uuid],
    }),
    foreignKey({
      name: "fk_purchase_invoice_items_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_purchase_invoice_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectPurchaseInvoiceItems = InferSelectModel<
  typeof PurchaseInvoiceItems
>;
export type InsertPurchaseInvoiceItems = InferInsertModel<
  typeof PurchaseInvoiceItems
>;
