import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  char,
  date,
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
    loading: mysqlEnum("loading", machineLoadingTypes)
      .notNull()
      .default("load"),
    stockLocationUuid: char("stock_location_uuid", { length: 36 }).notNull(),
    remarks: text("remarks"),
    minLengthMm: int("min_length_mm"),
    maxLengthMm: int("max_length_mm"),
    outOfBusiness: boolean("out_of_business").notNull().default(false),
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
