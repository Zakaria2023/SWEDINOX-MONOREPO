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
    //
    // Charge lines are NOT here. The reference shows both in one grid, told
    // apart by a `Linetype` of `Orderline` (5.180 lines) or `Surcharge` (470),
    // but a charge already has its own table in `InvoiceSurcharges` — so the
    // combined grid is built by unioning the two, the way the Orders and
    // Quotes overview unions four document tables.
    orderItemUuid: char("order_item_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),

    // ── Price and cost, snapshotted from the order line at invoicing ──────────
    // An invoice is the financial record of a sale, so it has to be able to say
    // on its own what it was worth and what it made. Reading back through the
    // order line would leave both open to drift: the order can be re-priced or
    // its lot revalued long after the invoice went out, and the margin already
    // reported to the customer's account must not move with it.
    //
    // These are copied, not recomputed — the order line resolved them from the
    // contract and its allocated stock lot at reservation, and that resolution
    // is the one being billed.
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    costPrice: decimal("cost_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    costAmount: decimal("cost_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    replacementPrice: decimal("replacement_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),
    profitMargin: decimal("profit_margin", { precision: 6, scale: 2 }).default(
      "0.00",
    ),

    // ── The metal and the processing, reported apart ──────────────────────────
    // The reference bills both on one line and then splits them, so a line's
    // revenue and profit each come in three: products, options, and the sum.
    // Both identities hold exactly across its 5.650 invoice lines.
    //
    //   revenue = revenueProducts + revenueOptions
    //   profit  = profitProducts  + profitOptions
    //
    // `amount` and `profit` above are the sums. These are the halves, and the
    // option half is nearly always zero because an option is sold at cost.
    revenueProducts: decimal("revenue_products", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    revenueOptions: decimal("revenue_options", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    profitProducts: decimal("profit_products", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    profitOptions: decimal("profit_options", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    profitReplPrice: decimal("profit_repl_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    weightKg: decimal("weight_kg", { precision: 15, scale: 2 }).default("0.00"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_invoice_items_invoice_uuid").on(table.invoiceUuid),
    index("idx_invoice_items_created_at_id").on(table.createdAt, table.id),
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
