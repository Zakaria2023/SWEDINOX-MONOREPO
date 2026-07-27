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
import { Invoices } from "./invoices";
import { OrderItems } from "./order-items";
import { Products } from "./products";

export const InvoiceItems = mysqlTable(
  "InvoiceItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    invoiceUuid: char("invoice_uuid", { length: 36 }).notNull(),
    // The reservation this line bills — always invoiced in full.
    orderItemUuid: char("order_item_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_invoice_items_invoice_uuid").on(table.invoiceUuid),
    index("idx_invoice_items_order_item_uuid").on(table.orderItemUuid),
    index("idx_invoice_items_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_invoice_items_invoice",
      columns: [table.invoiceUuid],
      foreignColumns: [Invoices.uuid],
    }),
    foreignKey({
      name: "fk_invoice_items_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
    foreignKey({
      name: "fk_invoice_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectInvoiceItems = InferSelectModel<typeof InvoiceItems>;
export type InsertInvoiceItems = InferInsertModel<typeof InvoiceItems>;
