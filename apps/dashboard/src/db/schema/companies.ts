import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const Companies = mysqlTable("Companies", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectCompanies = InferSelectModel<typeof Companies>;
export type InsertCompanies = InferInsertModel<typeof Companies>;
