import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

// The branch's own settings — the reference's `Vestigingsgegevens`, which its
// security profiles prove exists (72 rights, `Instellingen Verkoop`,
// `Instellingen Financiën`, …) and no screen we have opened shows.
//
// One row, id 1. A setting belongs here when a rule reads it and it is not per
// customer.
export const BranchSettings = mysqlTable("BranchSettings", {
  id: int("id").primaryKey(),

  // How many days past its due date the oldest open invoice may be before the
  // credit rule holds a new order. The reference's number is still unknown
  // (question K1); 30 is the assumption `OVERDUE_POST_BLOCK_DAYS` shipped with.
  overduePostBlockDays: int("overdue_post_block_days").default(30).notNull(),

  // The branch's own legal name — the reference's `Affiliate company details`
  // column, one constant on every sales and purchase document
  // (`HEGO TEST Stainless Steel & Aluminium` there).
  affiliateName: varchar("affiliate_name", { length: 255 }),

  updatedByUserId: varchar("updated_by_user_id", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectBranchSettings = InferSelectModel<typeof BranchSettings>;
export type InsertBranchSettings = InferInsertModel<typeof BranchSettings>;
