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
  varchar,
} from "drizzle-orm/mysql-core";
import { orderLineStatuses, stockUnits } from "../../lib/enums";
import { QuoteItems } from "./quote-items";
import { Quotes } from "./quotes";
import { RevenueGroups } from "./revenue-groups";
import { SalesOptions } from "./sales-options";

// An option quoted on a quote line — the processing the customer would be
// billed for on top of the material. Mirrors OrderItemOptions so a quote that
// becomes an order carries its options across unchanged.
//
// Kept as its own table rather than folded into the line because the quote's
// summary reports options as their own revenue/profit row, separate from
// materials.
export const QuoteItemOptions = mysqlTable(
  "QuoteItemOptions",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    quoteUuid: char("quote_uuid", { length: 36 }).notNull(),
    quoteItemUuid: char("quote_item_uuid", { length: 36 }).notNull(),
    optionUuid: char("option_uuid", { length: 36 }).notNull(),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),

    lineStatus: mysqlEnum("line_status", orderLineStatuses).default(
      "in_progress",
    ),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).default("0.000"),
    unit: mysqlEnum("unit", stockUnits).default("st"),
    weightKg: decimal("weight_kg", { precision: 15, scale: 2 }).default("0.00"),

    price: decimal("price", { precision: 15, scale: 2 }).default("0.00"),
    priceUnit: varchar("price_unit", { length: 10 }),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // Line totals: revenue quoted, cost incurred and the difference.
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    cost: decimal("cost", { precision: 15, scale: 2 }).default("0.00"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_quote_item_options_quote_uuid").on(table.quoteUuid),
    index("idx_quote_item_options_quote_item_uuid").on(table.quoteItemUuid),
    index("idx_quote_item_options_option_uuid").on(table.optionUuid),
    index("idx_quote_item_options_revenue_group_uuid").on(
      table.revenueGroupUuid,
    ),
    foreignKey({
      name: "fk_quote_item_options_quote",
      columns: [table.quoteUuid],
      foreignColumns: [Quotes.uuid],
    }),
    foreignKey({
      name: "fk_quote_item_options_quote_item",
      columns: [table.quoteItemUuid],
      foreignColumns: [QuoteItems.uuid],
    }),
    foreignKey({
      name: "fk_quote_item_options_option",
      columns: [table.optionUuid],
      foreignColumns: [SalesOptions.uuid],
    }),
    foreignKey({
      name: "fk_quote_item_options_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
  ],
);

export type SelectQuoteItemOptions = InferSelectModel<typeof QuoteItemOptions>;
export type InsertQuoteItemOptions = InferInsertModel<typeof QuoteItemOptions>;
