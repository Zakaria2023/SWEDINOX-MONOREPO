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
import { vatCodes } from "../../lib/enums";
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
    // The ordered line this receipt was booked against — where its price came
    // from, and what a purchase return traces back through.
    purchaseOrderItemUuid: char("purchase_order_item_uuid", { length: 36 }),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),

    // What the line was actually booked at, copied from the order line at the
    // moment the goods were received. Held as a snapshot for the same reason a
    // sales invoice line holds one: re-pricing the purchase order afterwards
    // must not rewrite an invoice that has already been posted.
    netPrice: decimal("net_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    // The product's VAT code as it stood when the line was booked, so the
    // three-band split on the document survives a product being recoded.
    vatCode: mysqlEnum("vat_code", vatCodes),

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
