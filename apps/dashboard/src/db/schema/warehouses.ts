import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  warehouseAddresses,
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
} from "../../lib/enums";

export const Warehouses = mysqlTable("Warehouses", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  locationType: mysqlEnum("location_type", warehouseLocationTypes),
  loadingLocation: mysqlEnum("loading_location", warehouseLoadingLocations),
  address: mysqlEnum("address", warehouseAddresses),
  blocked: boolean("blocked").notNull().default(false),
  blockReason: mysqlEnum("block_reason", warehouseBlockReasons),
  blockedForOptimization: boolean("blocked_for_optimization")
    .notNull()
    .default(false),
  limitedDimensions: boolean("limited_dimensions").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectWarehouses = InferSelectModel<typeof Warehouses>;
export type InsertWarehouses = InferInsertModel<typeof Warehouses>;
