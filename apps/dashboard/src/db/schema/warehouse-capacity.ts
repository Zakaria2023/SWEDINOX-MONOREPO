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

    // Which pool the capacity belongs to, when the type alone does not say.
    //
    // `fetching` is one type here and TEN jobs in the reference: its capacity
    // export carries fifteen work order types where the Warehouse workorders
    // screen shows six, because `Aanhalen` splits into Laser (284 rows),
    // Slijpen (266), Laser Folie (152), Knippen (56), Borstelen (32), UV Folie
    // (25), Blauwe Folie (23), Decoilen (11), Folie verwijderen (4) and Duplo
    // (2). They line up one for one with the processing options bought as
    // service lines on a purchase order.
    //
    // The discriminator is the **destination**, not a machine: `Machines` has
    // no detail screen at all, and `Decoiler`, `Laser 1`, `Laser 2` and `Knip`
    // are themselves locations under the `Productie` section. So a fetching to
    // the decoiler and a fetching to the laser draw on different pools because
    // they end up in different places.
    //
    // Null on every type that needs no splitting — a picking is a picking.
    toLocationUuid: char("to_location_uuid", { length: 36 }),

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
    index("idx_warehouse_capacity_to_location_uuid").on(table.toLocationUuid),
  ],
);

export type SelectWarehouseCapacity = InferSelectModel<
  typeof WarehouseCapacity
>;
export type InsertWarehouseCapacity = InferInsertModel<
  typeof WarehouseCapacity
>;
