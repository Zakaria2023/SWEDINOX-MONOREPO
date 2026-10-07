import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { CompanyAddresses } from "./company-addresses";
import { Orders } from "./orders";

// One call-off against a `Call-off` order: the customer ringing for part of
// what was ordered. Captured on order `100785` (7-10-2026): its `Call-offs`
// panel lists rows with their own customer reference, delivery address,
// `Rush` and `IsSend`, and who last changed each one and when — a child record
// of the order, not fields on it. The order's `Call-off period` is the window
// they fall in.
export const OrderCallOffs = mysqlTable(
  "OrderCallOffs",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderUuid: char("order_uuid", { length: 36 }).notNull(),
    customerRef: varchar("customer_ref", { length: 255 }),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
    isRush: boolean("is_rush").default(false).notNull(),
    // The reference's `IsSend` — whether the call-off went to the customer.
    isSent: boolean("is_sent").default(false).notNull(),

    modifiedByUserId: varchar("modified_by_user_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_order_call_offs_order_uuid").on(table.orderUuid),
    foreignKey({
      name: "fk_order_call_offs_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_order_call_offs_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectOrderCallOffs = InferSelectModel<typeof OrderCallOffs>;
export type InsertOrderCallOffs = InferInsertModel<typeof OrderCallOffs>;
