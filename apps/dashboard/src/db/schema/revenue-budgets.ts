import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { RevenueGroups } from "./revenue-groups";

// Budget figures per revenue group and period, compared against actuals on
// the "Revenue w.r.t. Budget" report. A null month means an annual budget.
export const RevenueBudgets = mysqlTable(
  "RevenueBudgets",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),
    financialYear: int("financial_year").notNull(),
    month: int("month"),
    orderType: varchar("order_type", { length: 100 }),
    weightBudget: decimal("weight_budget", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    revenueBudget: decimal("revenue_budget", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    profitBudget: decimal("profit_budget", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_revenue_budgets_revenue_group_uuid").on(table.revenueGroupUuid),
    index("idx_revenue_budgets_year").on(table.financialYear),
    foreignKey({
      name: "fk_revenue_budgets_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
  ],
);

export type SelectRevenueBudgets = InferSelectModel<typeof RevenueBudgets>;
export type InsertRevenueBudgets = InferInsertModel<typeof RevenueBudgets>;
