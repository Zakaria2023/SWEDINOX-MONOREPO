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
import { OrderItems } from "./order-items";
import { Orders } from "./orders";
import { RevenueGroups } from "./revenue-groups";
import { SalesOptions } from "./sales-options";

// An option actually charged on an order line — the processing the customer is
// billed for on top of the material. One row per order line and option, priced
// from the product's option price at the moment it was booked, so the revenue
// stands even after the option price is changed.
//
// Backs the "Options" overview, which totals revenue and profit per option.
export const OrderItemOptions = mysqlTable(
  "OrderItemOptions",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderUuid: char("order_uuid", { length: 36 }).notNull(),
    orderItemUuid: char("order_item_uuid", { length: 36 }).notNull(),
    optionUuid: char("option_uuid", { length: 36 }).notNull(),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),

    // Copied from the order line, so the overview can split revenue by how far
    // the line has got without re-joining.
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

    // Line totals: revenue billed, cost incurred and the difference.
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    cost: decimal("cost", { precision: 15, scale: 2 }).default("0.00"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_order_item_options_order_uuid").on(table.orderUuid),
    index("idx_order_item_options_order_item_uuid").on(table.orderItemUuid),
    index("idx_order_item_options_option_uuid").on(table.optionUuid),
    index("idx_order_item_options_revenue_group_uuid").on(
      table.revenueGroupUuid,
    ),
    foreignKey({
      name: "fk_order_item_options_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_order_item_options_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
    foreignKey({
      name: "fk_order_item_options_option",
      columns: [table.optionUuid],
      foreignColumns: [SalesOptions.uuid],
    }),
    foreignKey({
      name: "fk_order_item_options_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
  ],
);

export type SelectOrderItemOptions = InferSelectModel<typeof OrderItemOptions>;
export type InsertOrderItemOptions = InferInsertModel<typeof OrderItemOptions>;
