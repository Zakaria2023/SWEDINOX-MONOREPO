import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

// Industry lookup table (Standaard Bedrijfsindeling / SBI). The SBI code is the
// primary key (`id`) — kept as a string so leading zeros are preserved
// (e.g. "0111", "01131"). Seed with `pnpm db:seed:industries`.
export const Industries = mysqlTable("Industries", {
  id: varchar("id", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectIndustries = InferSelectModel<typeof Industries>;
export type InsertIndustries = InferInsertModel<typeof Industries>;
