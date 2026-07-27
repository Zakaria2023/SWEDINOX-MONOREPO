import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { orderDeblockTypes } from "../../lib/enums";
import { Orders } from "./orders";

// Audit trail of order block releases. One row per unblock event: which order,
// which block was lifted, when, and by which Clerk user. createdAt is the
// deblock date/time.
export const OrderDeblocks = mysqlTable(
  "OrderDeblocks",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderUuid: char("order_uuid", { length: 36 }).notNull(),
    deblockType: mysqlEnum("deblock_type", orderDeblockTypes).notNull(),
    deblockedByUserId: varchar("deblocked_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_order_deblocks_order_uuid").on(table.orderUuid),
    foreignKey({
      name: "fk_order_deblocks_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
  ],
);

export type SelectOrderDeblocks = InferSelectModel<typeof OrderDeblocks>;
export type InsertOrderDeblocks = InferInsertModel<typeof OrderDeblocks>;
