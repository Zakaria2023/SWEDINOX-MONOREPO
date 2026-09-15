import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { systemLogCategories } from "../../lib/enums";

// What the application did on somebody's behalf, in words — the reference's
// `System info → Errors`. Its 9 360 entries are mostly not failures: delivery
// dates moved, orders held, reservations given back. A null user is the system
// itself, which the reference prints as `System`.
//
// No foreign key to the order: an entry must outlive the record it talks about.
export const SystemLogs = mysqlTable(
  "SystemLogs",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    category: mysqlEnum("category", systemLogCategories).notNull(),
    message: varchar("message", { length: 1000 }).notNull(),
    orderUuid: char("order_uuid", { length: 36 }),
    userId: varchar("user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_system_logs_category").on(table.category),
    index("idx_system_logs_order_uuid").on(table.orderUuid),
    index("idx_system_logs_created_at").on(table.createdAt),
  ],
);

export type SelectSystemLogs = InferSelectModel<typeof SystemLogs>;
export type InsertSystemLogs = InferInsertModel<typeof SystemLogs>;
