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
import { locationAdoptPositions, locationTypes } from "../../lib/enums";
import { CompanyAddresses } from "./company-addresses";

export const LoadingLocations = mysqlTable("loading_locations", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),

  name: varchar("name", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const Locations = mysqlTable(
  "locations",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    name: varchar("name", { length: 255 }).notNull(),
    locationType: mysqlEnum("location_type", locationTypes).notNull(),
    loadingLocationUuid: char("loading_location_uuid", { length: 36 }),
    addressUuid: char("address_uuid", { length: 36 }),

    isBlocked: boolean("is_blocked").default(false),
    blockedReason: varchar("blocked_reason", { length: 255 }),
    blockedForOptimization: boolean("blocked_for_optimization").default(false),
    limitedDimensions: boolean("limited_dimensions").default(false),

    // TODO: Later this should come from the warehouses table.
    adoptFrom: varchar("adopt_from", { length: 255 }),
    // Controls whether the adopted location is placed next to or below this location.
    adoptPosition: mysqlEnum("adopt_position", locationAdoptPositions).default(
      "below",
    ),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_locations_loading_location_uuid").on(table.loadingLocationUuid),
    index("idx_locations_address_uuid").on(table.addressUuid),
    foreignKey({
      name: "fk_locations_loading_location",
      columns: [table.loadingLocationUuid],
      foreignColumns: [LoadingLocations.uuid],
    }),
    foreignKey({
      name: "fk_locations_address",
      columns: [table.addressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);
