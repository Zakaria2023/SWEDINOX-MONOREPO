import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  warehouseWorkOrderStatuses,
  warehouseWorkOrderLineTypes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { Warehouses } from "./warehouses";

export const WarehouseWorkOrders = mysqlTable(
  "WarehouseWorkOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    warehouseUuid: char("warehouse_uuid", { length: 36 }).notNull(),
    status: mysqlEnum("status", warehouseWorkOrderStatuses)
      .notNull()
      .default("new"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouse_work_orders_warehouse_uuid").on(table.warehouseUuid),
    foreignKey({
      name: "fk_warehouse_work_orders_warehouse",
      columns: [table.warehouseUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

export const WarehouseWorkOrderLines = mysqlTable(
  "WarehouseWorkOrderLines",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),
    date: date("date"),
    type: mysqlEnum("type", warehouseWorkOrderLineTypes),
    orderNumber: varchar("order_number", { length: 50 }),
    companyUuid: char("company_uuid", { length: 36 }),
    productCode: varchar("product_code", { length: 100 }),
    orderRef: varchar("order_ref", { length: 100 }),
    status: mysqlEnum("status", warehouseWorkOrderStatuses)
      .notNull()
      .default("new"),
    fromLocation: varchar("from_location", { length: 255 }),
    toLocation: varchar("to_location", { length: 255 }),
    length: int("length"),
    width: int("width"),
    thickness: int("thickness"),
    qtyPlanned: decimal("qty_planned", { precision: 10, scale: 3 }),
    qtyActual: decimal("qty_actual", { precision: 10, scale: 3 }),
    kgPlanned: decimal("kg_planned", { precision: 10, scale: 2 }),
    kgActual: decimal("kg_actual", { precision: 10, scale: 2 }),
    internalBatch: varchar("internal_batch", { length: 100 }),
    charge: varchar("charge", { length: 100 }),
    internalCharge: varchar("internal_charge", { length: 100 }),
    colliCount: int("colli_count"),
    packaging: varchar("packaging", { length: 100 }),
    priority: int("priority"),
    rush: boolean("rush").notNull().default(false),
    options: varchar("options", { length: 255 }),
    qualityCode: varchar("quality_code", { length: 100 }),
    quality: varchar("quality", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouse_work_order_lines_work_order_uuid").on(
      table.workOrderUuid,
    ),
    index("idx_warehouse_work_order_lines_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_warehouse_work_order_lines_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [WarehouseWorkOrders.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectWarehouseWorkOrders = InferSelectModel<
  typeof WarehouseWorkOrders
>;
export type InsertWarehouseWorkOrders = InferInsertModel<
  typeof WarehouseWorkOrders
>;
export type SelectWarehouseWorkOrderLines = InferSelectModel<
  typeof WarehouseWorkOrderLines
>;
export type InsertWarehouseWorkOrderLines = InferInsertModel<
  typeof WarehouseWorkOrderLines
>;
