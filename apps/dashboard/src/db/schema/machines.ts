import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  machineCapacityUnits,
  machineLoadingTypes,
  machineOptionTypes,
  machineProductionTypes,
} from "../../lib/enums";
import { ProductGroups } from "./product-groups";
import { Products } from "./products";
import { Warehouses } from "./warehouses";

export const Machines = mysqlTable(
  "Machines",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    option: mysqlEnum("machine_option", machineOptionTypes).notNull(),
    production: mysqlEnum("production", machineProductionTypes).notNull(),
    loading: mysqlEnum("loading", machineLoadingTypes).default("load"),
    stockLocationUuid: char("stock_location_uuid", { length: 36 }).notNull(),
    remarks: text("remarks"),
    minLengthMm: int("min_length_mm"),
    maxLengthMm: int("max_length_mm"),
    outOfBusiness: boolean("out_of_business").default(false),
    outOfBusinessFrom: date("out_of_business_from"),
    outOfBusinessUntil: date("out_of_business_until"),
    averageDailyCapacity: int("average_daily_capacity"),
    averageDailyCapacityUnit: mysqlEnum(
      "average_daily_capacity_unit",
      machineCapacityUnits,
    ),
    warningPercentage: int("warning_percentage"),
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_machines_code").on(table.code),
    uniqueIndex("uniq_machines_production").on(table.production),
    index("idx_machines_stock_location_uuid").on(table.stockLocationUuid),
    foreignKey({
      name: "fk_machines_stock_location",
      columns: [table.stockLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

export type SelectMachines = InferSelectModel<typeof Machines>;
export type InsertMachines = InferInsertModel<typeof Machines>;

export const machinesRelations = relations(Machines, ({ one }) => ({
  stockLocation: one(Warehouses, {
    fields: [Machines.stockLocationUuid],
    references: [Warehouses.uuid],
  }),
}));

export const MachineProducts = mysqlTable(
  "MachineProducts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    machineUuid: char("machine_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }),
    productGroupUuid: char("product_group_uuid", { length: 36 }),

    // Snapshot of the picked product/group, mirroring how a company keeps
    // its own copy rather than referencing the catalog row directly.
    productCode: varchar("product_code", { length: 100 }),
    description: varchar("description", { length: 255 }),

    preference: int("preference").default(1),
    productionPerHour: int("production_per_hour").default(0),
    prodUnit: varchar("prod_unit", { length: 50 }),
    minCorner: decimal("min_corner", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    maxCorner: decimal("max_corner", { precision: 6, scale: 2 }).default(
      "90.00",
    ),
    daysInSystem: int("days_in_system").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_machine_products_machine_uuid").on(table.machineUuid),
    index("idx_machine_products_product_uuid").on(table.productUuid),
    index("idx_machine_products_product_group_uuid").on(table.productGroupUuid),
    foreignKey({
      name: "fk_machine_products_machine",
      columns: [table.machineUuid],
      foreignColumns: [Machines.uuid],
    }),
    foreignKey({
      name: "fk_machine_products_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_machine_products_product_group",
      columns: [table.productGroupUuid],
      foreignColumns: [ProductGroups.uuid],
    }),
  ],
);

export const MachinePostProcessings = mysqlTable(
  "MachinePostProcessings",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    machineUuid: char("machine_uuid", { length: 36 }).notNull(),
    option: mysqlEnum("post_processing_option", machineOptionTypes),
    preference: int("preference").default(0),
    daysInSystem: int("days_in_system").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_machine_post_processings_machine_uuid").on(table.machineUuid),
    foreignKey({
      name: "fk_machine_post_processings_machine",
      columns: [table.machineUuid],
      foreignColumns: [Machines.uuid],
    }),
  ],
);

export type SelectMachineProducts = InferSelectModel<typeof MachineProducts>;
export type InsertMachineProducts = InferInsertModel<typeof MachineProducts>;
export type SelectMachinePostProcessings = InferSelectModel<
  typeof MachinePostProcessings
>;
export type InsertMachinePostProcessings = InferInsertModel<
  typeof MachinePostProcessings
>;
