import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { RevenueGroups } from "./revenue-groups";

// The budget for one revenue group in one month, in the reference's shape
// (`REVENUEGROUP_BUDGET`): revenue and weight **each split by order type** —
// out of stock, cross-dock, ex factory — and the profit budgeted as a
// **percentage** per type rather than an amount. The profit amount the report
// compares against is revenue × percentage, per type.
//
// Replaced the earlier one-row-per-order-type shape on 15-9-2026 (the table was
// empty, so nothing was lost).
export const RevenueBudgets = mysqlTable(
  "RevenueBudgets",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }).notNull(),
    year: int("year").notNull(),
    month: int("month").notNull(),

    revenueStock: decimal("revenue_stock", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    revenueCrossDock: decimal("revenue_cross_dock", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    revenueFactory: decimal("revenue_factory", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    weightStock: decimal("weight_stock", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    weightCrossDock: decimal("weight_cross_dock", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    weightFactory: decimal("weight_factory", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    profitPercentageStock: decimal("profit_percentage_stock", {
      precision: 6,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    profitPercentageCrossDock: decimal("profit_percentage_cross_dock", {
      precision: 6,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    profitPercentageFactory: decimal("profit_percentage_factory", {
      precision: 6,
      scale: 2,
    })
      .default("0.00")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    // One budget per group per month: saving the same month again replaces it.
    uniqueIndex("uq_revenue_budgets_group_period").on(
      table.revenueGroupUuid,
      table.year,
      table.month,
    ),
    index("idx_revenue_budgets_year_month").on(table.year, table.month),
    foreignKey({
      name: "fk_revenue_budgets_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
  ],
);

export type SelectRevenueBudgets = InferSelectModel<typeof RevenueBudgets>;
export type InsertRevenueBudgets = InferInsertModel<typeof RevenueBudgets>;
