import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { discountUnits, invoiceLineTypes, stockUnits } from "../../lib/enums";
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

    // The number this line prints under, taken from the order line it bills
    // rather than from a counter of its own — so invoice `501106` carries
    // lines 60, 70 and 80 and has no line 10.
    lineNumber: int("line_number"),

    // Whether this line charges or refunds. The reference has no separate
    // credit-note document: a credit is a line type, which is how one invoice
    // can correct another in place.
    type: mysqlEnum("type", invoiceLineTypes).default("debit").notNull(),

    description: varchar("description", { length: 255 }),
    // The day the goods this line bills actually went out. Not the invoice
    // date — order `100742` shipped in February and again in March, and the
    // two invoices are dated by their shipment, not by the order.
    deliveryDate: date("delivery_date", { mode: "string" }),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    unit: mysqlEnum("unit", stockUnits),

    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),

    // ── What the customer is actually charged, as the invoice prints it ──────
    // The line is priced per unit of `priceUnit`, and `priceQty` is how many
    // of that unit this line bills — 64 pieces weighing 1209,6 kg invoice as
    // `1,2096 TN`. The identity holds to the cent on every line of order
    // `100742`:
    //
    //     amount = priceQty × grossPrice, less the discounts below
    //
    // Stored rather than derived from `quantity` and `weightKg` because the
    // conversion is the scale's, not arithmetic's: the tonnage billed is what
    // the goods weighed when they were loaded.
    priceQty: decimal("price_qty", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    priceUnit: varchar("price_unit", { length: 10 }),
    grossPrice: decimal("gross_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    lineDiscount: decimal("line_discount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    // The `RdU` and `GdU` columns: what the two discounts beside them are
    // denominated in. Without these a discount of `5` is unreadable.
    lineDiscountUnit: mysqlEnum("line_discount_unit", discountUnits)
      .default("percent")
      .notNull(),
    groupDiscount: decimal("group_discount", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    groupDiscountUnit: mysqlEnum("group_discount_unit", discountUnits)
      .default("percent")
      .notNull(),
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

    // ── Cost and margin, snapshotted from the order line at invoicing ────────
    // An invoice is the financial record of a sale, so it has to be able to say
    // on its own what it was worth and what it made. Reading back through the
    // order line would leave both open to drift: the order can be re-priced or
    // its lot revalued long after the invoice went out, and the margin already
    // reported to the customer's account must not move with it.
    //
    // These are copied, not recomputed — the order line resolved them from the
    // contract and its allocated stock lot at reservation, and that resolution
    // is the one being billed.
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

    // ── The certificate chain, arriving ──────────────────────────────────────
    // The melt the billed metal came from, the purchase order that bought it
    // and the day it was received. These travel all the way down — mill, to
    // goods-in, to the pick, to the lorry, to here — so a customer asking
    // "which heat was on invoice 501106 line 70" is answered from the invoice
    // without walking back up the chain. `batch-registration.md` §3 proved the
    // same link from the other end on 1.662 of 1.662 rows.
    charge: varchar("charge", { length: 100 }),
    purchaseOrderNumber: varchar("purchase_order_number", { length: 50 }),
    receiptDate: date("receipt_date", { mode: "string" }),

    // ── Sending, recorded per line ───────────────────────────────────────────
    // Not per invoice: the reference stamps each line with its own print and
    // mail state, address included. On order `100742` all four lines read
    // printed ☐ / mailed ☑ with the timestamp the mail actually left.
    printed: boolean("printed").default(false).notNull(),
    printedAt: timestamp("printed_at"),
    mailed: boolean("mailed").default(false).notNull(),
    mailedAt: timestamp("mailed_at"),
    mailedTo: varchar("mailed_to", { length: 255 }),

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
