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
import { tripStatuses } from "../../lib/enums";
import { Orders } from "./orders";
import { OrderItems } from "./order-items";

// Transport status adjustment — the Logistics "Transport status adjustments"
// overview. A log of trip-status changes: who changed it, when, the new
// status, and the bill of lading / order / order line the change applies to.
export const TransportStatusAdjustments = mysqlTable(
  "TransportStatusAdjustments",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // Who changed the status ("Modifier") and when ("Time modified").
    modifier: varchar("modifier", { length: 255 }),
    timeModified: timestamp("time_modified").notNull(),

    // The status the trip was set to ("Trip status"). Seven states, not the
    // four a delivery has — the reference logs `loading_list`, `loaded` and
    // `loading_done` separately because the loading bay needs to tell them
    // apart, and this screen exists to record exactly those transitions.
    tripStatus: mysqlEnum("trip_status", tripStatuses),

    // What the change applies to: the "Bill of lading" reference and the
    // linked "Order" / "Order line".
    billOfLading: varchar("bill_of_lading", { length: 100 }),
    orderUuid: char("order_uuid", { length: 36 }),
    orderItemUuid: char("order_item_uuid", { length: 36 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_transport_status_adjustments_time_modified").on(
      table.timeModified,
    ),
    index("idx_transport_status_adjustments_order_uuid").on(table.orderUuid),
    index("idx_transport_status_adjustments_order_item_uuid").on(
      table.orderItemUuid,
    ),
    foreignKey({
      name: "fk_transport_status_adjustments_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_transport_status_adjustments_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
  ],
);

export type SelectTransportStatusAdjustments = InferSelectModel<
  typeof TransportStatusAdjustments
>;
export type InsertTransportStatusAdjustments = InferInsertModel<
  typeof TransportStatusAdjustments
>;
