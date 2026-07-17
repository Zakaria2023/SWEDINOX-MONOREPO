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
import { Machines } from "./machines";
import { Warehouses } from "./warehouses";

// Batches produced on a machine, destined for a stock location.
export const ProductionBatches = mysqlTable(
  "ProductionBatches",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    code: varchar("code", { length: 100 }).notNull(),
    // "Aangemaakt" — when the batch was created on the floor.
    createdOn: date("created_on", { mode: "string" }),
    machineUuid: char("machine_uuid", { length: 36 }),
    toLocationUuid: char("to_location_uuid", { length: 36 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_batches_machine_uuid").on(table.machineUuid),
    index("idx_production_batches_to_location_uuid").on(table.toLocationUuid),
    foreignKey({
      name: "fk_production_batches_machine",
      columns: [table.machineUuid],
      foreignColumns: [Machines.uuid],
    }),
    foreignKey({
      name: "fk_production_batches_to_location",
      columns: [table.toLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

export type SelectProductionBatches = InferSelectModel<
  typeof ProductionBatches
>;
export type InsertProductionBatches = InferInsertModel<
  typeof ProductionBatches
>;
