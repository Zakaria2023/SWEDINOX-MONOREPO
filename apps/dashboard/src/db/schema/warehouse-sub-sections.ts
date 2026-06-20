import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
} from "../../lib/enums";
import { Warehouses } from "./warehouses";

export const WarehouseSubSections = mysqlTable(
  "WarehouseSubSections",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    warehouseUuid: char("warehouse_uuid", { length: 36 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    locationType: mysqlEnum("location_type", warehouseLocationTypes),
    loadingLocation: mysqlEnum("loading_location", warehouseLoadingLocations),
    blocked: boolean("blocked").notNull().default(false),
    blockReason: mysqlEnum("block_reason", warehouseBlockReasons),
    blockedForOptimization: boolean("blocked_for_optimization")
      .notNull()
      .default(false),
    limitedDimensions: boolean("limited_dimensions").notNull().default(false),
    pickingSequence: int("picking_sequence"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouse_sub_sections_warehouse_uuid").on(table.warehouseUuid),
    foreignKey({
      name: "fk_warehouse_sub_sections_warehouse",
      columns: [table.warehouseUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

export type SelectWarehouseSubSections = InferSelectModel<
  typeof WarehouseSubSections
>;
export type InsertWarehouseSubSections = InferInsertModel<
  typeof WarehouseSubSections
>;
