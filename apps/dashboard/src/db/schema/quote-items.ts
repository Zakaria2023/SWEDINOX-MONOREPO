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
import { orderLineStatuses, stockUnits } from "../../lib/enums";
import { Orders } from "./orders";
import { Products } from "./products";
import { Quotes } from "./quotes";
import { RevenueGroups } from "./revenue-groups";

// Line items of a sales quote — what the customer was actually quoted. Backs the
// "Quote lines" overview. A line keeps its own priced snapshot (gross price,
// discounts, cost) so the quote still reads the same after the product's
// catalogue price moves. `convertedToOrderUuid` is set when the quote is turned
// into a real order, which is what the overview's "Converted to" column shows.
export const QuoteItems = mysqlTable(
  "QuoteItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    quoteUuid: char("quote_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),
    convertedToOrderUuid: char("converted_to_order_uuid", { length: 36 }),

    // ── Line identity ─────────────────────────────────────────────────────────
    lineNumber: int("line_number"),
    lineType: varchar("line_type", { length: 50 }),
    status: mysqlEnum("status", orderLineStatuses).default("in_progress"),
    expirationReason: varchar("expiration_reason", { length: 255 }),
    description: varchar("description", { length: 255 }),
    reference: varchar("reference", { length: 255 }),
    options: varchar("options", { length: 255 }),
    deliveryDate: date("delivery_date", { mode: "string" }),

    // ── Physical attributes ───────────────────────────────────────────────────
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    quantity: decimal("quantity", { precision: 15, scale: 3 }).default("0.000"),
    unit: mysqlEnum("unit", stockUnits).default("st"),
    weightKg: decimal("weight_kg", { precision: 15, scale: 2 }).default("0.00"),

    // ── Pricing ───────────────────────────────────────────────────────────────
    grossPrice: decimal("gross_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceUnit: varchar("price_unit", { length: 10 }),
    groupDiscount: decimal("group_discount", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    lineDiscount: decimal("line_discount", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),
    profitMargin: decimal("profit_margin", { precision: 6, scale: 2 }).default(
      "0.00",
    ),

    // ── Cost basis ────────────────────────────────────────────────────────────
    // Two costs are kept per line because the summary reports profit twice: once
    // against what the goods actually cost (`purchasePrice`, the average
    // purchase price when the line was quoted) and once against what it would
    // cost to re-buy them today (`replacementPrice`). A falling market makes the
    // second number the honest one, which is why the reference system shows both
    // side by side.
    purchasePrice: decimal("purchase_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    replacementPrice: decimal("replacement_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    costAmount: decimal("cost_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    profitReplPrice: decimal("profit_repl_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    // Flagged when the line's margin falls under the minimum the product group
    // allows, so the salesperson sees it before the quote goes out.
    profitTooLow: boolean("profit_too_low").default(false),

    // Running metres per piece — the "M1(p)" column on the lines grid.
    m1PerPiece: decimal("m1_per_piece", { precision: 15, scale: 3 }).default(
      "0.000",
    ),

    // ── Commercial context ────────────────────────────────────────────────────
    isConsignment: boolean("is_consignment").default(false),
    affiliateCompany: varchar("affiliate_company", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_quote_items_quote_uuid").on(table.quoteUuid),
    index("idx_quote_items_product_uuid").on(table.productUuid),
    index("idx_quote_items_revenue_group_uuid").on(table.revenueGroupUuid),
    index("idx_quote_items_converted_to_order_uuid").on(
      table.convertedToOrderUuid,
    ),
    foreignKey({
      name: "fk_quote_items_quote",
      columns: [table.quoteUuid],
      foreignColumns: [Quotes.uuid],
    }),
    foreignKey({
      name: "fk_quote_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_quote_items_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
    foreignKey({
      name: "fk_quote_items_converted_to_order",
      columns: [table.convertedToOrderUuid],
      foreignColumns: [Orders.uuid],
    }),
  ],
);

export type SelectQuoteItems = InferSelectModel<typeof QuoteItems>;
export type InsertQuoteItems = InferInsertModel<typeof QuoteItems>;
