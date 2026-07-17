import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Revenue-group dimension — the bucket products roll up into for the Finance
// revenue reports (Revenue per revenue group, Revenue w.r.t. Budget).
export const RevenueGroups = mysqlTable("RevenueGroups", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  number: int("number"),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectRevenueGroups = InferSelectModel<typeof RevenueGroups>;
export type InsertRevenueGroups = InferInsertModel<typeof RevenueGroups>;
