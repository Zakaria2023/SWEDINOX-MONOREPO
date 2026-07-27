import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { productionCapacityStatuses } from "../../lib/enums";
import { Machines } from "./machines";

// Production capacity — the Logistics "Production capacity" overview. One row
// per machine per day, showing the machine's capacity for that day split into
// square and not-square measures (occupied, ready, remaining) against its
// maximum and warning thresholds. Machine code, name and type are pulled from
// the linked machine.
export const ProductionCapacity = mysqlTable(
  "ProductionCapacity",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The traffic-light "Status" and the day this snapshot is for ("Date").
    status: mysqlEnum("status", productionCapacityStatuses),
    capacityDate: date("capacity_date").notNull(),

    // The machine the capacity belongs to ("Machine" / "Type of machine").
    machineUuid: char("machine_uuid", { length: 36 }).notNull(),

    // Overall thresholds: "Maximum Capacity", the day's total "Capacity" and
    // the "Warning capacity" level.
    maximumCapacity: decimal("maximum_capacity", { precision: 15, scale: 2 }),
    capacity: decimal("capacity", { precision: 15, scale: 2 }),
    warningCapacity: decimal("warning_capacity", { precision: 15, scale: 2 }),

    // Square measures ("Ready", "Remaining", "Occupied capacity").
    ready: decimal("ready", { precision: 15, scale: 2 }),
    remaining: decimal("remaining", { precision: 15, scale: 2 }),
    occupiedCapacity: decimal("occupied_capacity", {
      precision: 15,
      scale: 2,
    }),

    // Not-square measures for linear/piece work.
    readyNotSquare: decimal("ready_not_square", { precision: 15, scale: 2 }),
    remainingNotSquare: decimal("remaining_not_square", {
      precision: 15,
      scale: 2,
    }),
    occupiedNotSquare: decimal("occupied_not_square", {
      precision: 15,
      scale: 2,
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_capacity_machine_uuid").on(table.machineUuid),
    index("idx_production_capacity_date").on(table.capacityDate),
    foreignKey({
      name: "fk_production_capacity_machine",
      columns: [table.machineUuid],
      foreignColumns: [Machines.uuid],
    }),
  ],
);

export type SelectProductionCapacity = InferSelectModel<
  typeof ProductionCapacity
>;
export type InsertProductionCapacity = InferInsertModel<
  typeof ProductionCapacity
>;
