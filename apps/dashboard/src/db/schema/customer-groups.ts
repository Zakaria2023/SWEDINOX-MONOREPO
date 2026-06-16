import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { char, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const CustomerGroups = mysqlTable("CustomerGroups", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectCustomerGroups = InferSelectModel<typeof CustomerGroups>;
export type InsertCustomerGroups = InferInsertModel<typeof CustomerGroups>;
