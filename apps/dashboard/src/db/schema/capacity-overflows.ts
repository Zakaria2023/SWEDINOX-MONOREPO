import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { CapacityChecks } from "./capacity-checks";
import { OrderItems } from "./order-items";

// An order line that pushes a capacity check past its ceiling, and what was
// done about it. The line and the check both already exist — this table records
// only the decision taken, because "the capacity is over" is a calculation
// while "who moved which line, and when" is a fact somebody has to enter.
export const OrderLineCapacityOverflows = mysqlTable(
  "OrderLineCapacityOverflows",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderItemUuid: char("order_item_uuid", { length: 36 }).notNull(),
    capacityCheckUuid: char("capacity_check_uuid", { length: 36 }),

    action: varchar("action", { length: 255 }),
    // Clerk user id of whoever took the action.
    actionByUserId: varchar("action_by_user_id", { length: 255 }),
    actionOn: date("action_on", { mode: "string" }),
    // Which department carries the overflow — sales, production or logistics.
    accountability: varchar("accountability", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_order_line_capacity_overflows_order_item_uuid").on(
      table.orderItemUuid,
    ),
    index("idx_order_line_capacity_overflows_capacity_check_uuid").on(
      table.capacityCheckUuid,
    ),
    foreignKey({
      name: "fk_order_line_capacity_overflows_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
    foreignKey({
      name: "fk_order_line_capacity_overflows_capacity_check",
      columns: [table.capacityCheckUuid],
      foreignColumns: [CapacityChecks.uuid],
    }),
  ],
);

export type SelectOrderLineCapacityOverflows = InferSelectModel<
  typeof OrderLineCapacityOverflows
>;
export type InsertOrderLineCapacityOverflows = InferInsertModel<
  typeof OrderLineCapacityOverflows
>;
