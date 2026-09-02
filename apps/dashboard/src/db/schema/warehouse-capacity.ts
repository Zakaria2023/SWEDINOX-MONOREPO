import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { warehouseWorkOrderTypes } from "../../lib/enums";

// Warehouse capacity — the Logistics "Warehouse capacity" overview. One row
// per date / section / subsection / workorder type, showing how much of that
// capacity is occupied, ready and still remaining for the day's workorders.
export const WarehouseCapacity = mysqlTable(
  "WarehouseCapacity",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The workorder day this capacity snapshot is for ("Date").
    capacityDate: date("capacity_date").notNull(),

    // Where the capacity sits ("Warehouse section" / "Subsection") and the
    // kind of work it covers ("Workorder type").
    warehouseSection: varchar("warehouse_section", { length: 255 }),
    subsection: varchar("subsection", { length: 255 }),
    workOrderType: mysqlEnum("work_order_type", warehouseWorkOrderTypes),

    // Capacity already taken, capacity ready to run, and what is left.
    occupied: decimal("occupied", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),
    ready: decimal("ready", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),
    remaining: decimal("remaining", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouse_capacity_date").on(table.capacityDate),
    index("idx_warehouse_capacity_section").on(table.warehouseSection),
  ],
);

export type SelectWarehouseCapacity = InferSelectModel<
  typeof WarehouseCapacity
>;
export type InsertWarehouseCapacity = InferInsertModel<
  typeof WarehouseCapacity
>;
