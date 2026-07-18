import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const Industries = mysqlTable("Industries", {
  id: varchar("id", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectIndustries = InferSelectModel<typeof Industries>;
export type InsertIndustries = InferInsertModel<typeof Industries>;
