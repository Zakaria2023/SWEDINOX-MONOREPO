import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  json,
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

export const Warehouses = mysqlTable(
  "Warehouses",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    parentUuid: char("parent_uuid", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),
    locationType: mysqlEnum("location_type", warehouseLocationTypes),
    loadingLocation: mysqlEnum("loading_location", warehouseLoadingLocations),
    // Only populated for root-level rows (parentUuid IS NULL)
    address: mysqlEnum("address", warehouseAddresses),
    blocked: boolean("blocked").notNull().default(false),
    blockReason: mysqlEnum("block_reason", warehouseBlockReasons),
    blockedForOptimization: boolean("blocked_for_optimization")
      .notNull()
      .default(false),
    limitedDimensions: boolean("limited_dimensions").notNull().default(false),
    minLength: int("min_length"),
    maxLength: int("max_length"),
    maxWidth: int("max_width"),
    maxWeight: int("max_weight"),
    productTypes: json("product_types").$type<string[]>(),
    loadLocations: json("load_locations").$type<
      Array<{ transportRegion: string; loadLocation: string }>
    >(),
    // Only populated for non-root rows (parentUuid IS NOT NULL)
    pickingSequence: int("picking_sequence"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouses_parent_uuid").on(table.parentUuid),
    foreignKey({
      name: "fk_warehouses_parent",
      columns: [table.parentUuid],
      foreignColumns: [table.uuid],
    }),
  ],
);

export type SelectWarehouses = InferSelectModel<typeof Warehouses>;
export type InsertWarehouses = InferInsertModel<typeof Warehouses>;
