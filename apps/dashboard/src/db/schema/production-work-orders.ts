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
  machineOptionTypes,
  workOrderStatuses,
} from "../../lib/enums";
import { Companies } from "./companies";
import { Machines } from "./machines";
import { OrderItems } from "./order-items";
import { Products } from "./products";

// Production work orders — a machine + processing option run on a date, with
// one line per order line to process (grouped Date > Machine/Option > Order).
export const ProductionWorkOrders = mysqlTable(
  "ProductionWorkOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    machineUuid: char("machine_uuid", { length: 36 }),
    option: mysqlEnum("option", machineOptionTypes),
    date: date("date", { mode: "string" }),
    status: mysqlEnum("status", workOrderStatuses).default("new"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_work_orders_machine_uuid").on(table.machineUuid),
    foreignKey({
      name: "fk_production_work_orders_machine",
      columns: [table.machineUuid],
      foreignColumns: [Machines.uuid],
    }),
  ],
);

export const ProductionWorkOrderLines = mysqlTable(
  "ProductionWorkOrderLines",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),
    date: date("date", { mode: "string" }),
    status: mysqlEnum("status", workOrderStatuses)
      .notNull()
      .default("new"),
    productUuid: char("product_uuid", { length: 36 }),
    productCode: varchar("product_code", { length: 100 }),
    orderNumber: varchar("order_number", { length: 50 }),
    // The order line this run is for. Completing the line has to draw its
    // material out of the lot that line reserved and hand the produced lot
    // back to it, so the link has to be a real reference — matching on order
    // number and product would tie two lines of the same product together.
    orderItemUuid: char("order_item_uuid", { length: 36 }),
    companyUuid: char("company_uuid", { length: 36 }),
    extraOptions: varchar("extra_options", { length: 255 }),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    qtyPlanned: decimal("qty_planned", { precision: 12, scale: 3 }),
    qtyActual: decimal("qty_actual", { precision: 12, scale: 3 }),
    unitPlanned: varchar("unit_planned", { length: 10 }),
    unitActual: varchar("unit_actual", { length: 10 }),
    kgPlanned: decimal("kg_planned", { precision: 12, scale: 2 }),
    kgActual: decimal("kg_actual", { precision: 12, scale: 2 }),
    qtyBack: decimal("qty_back", { precision: 12, scale: 3 }),
    fromLocation: varchar("from_location", { length: 255 }),
    toLocation: varchar("to_location", { length: 255 }),
    deliverOn: date("deliver_on", { mode: "string" }),
    isPickup: boolean("is_pickup").notNull().default(false),
    rush: boolean("rush").notNull().default(false),
    priority: int("priority"),
    charge: varchar("charge", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_work_order_lines_work_order_uuid").on(
      table.workOrderUuid,
    ),
    index("idx_production_work_order_lines_company_uuid").on(table.companyUuid),
    index("idx_production_work_order_lines_product_uuid").on(table.productUuid),
    index("idx_production_work_order_lines_order_item_uuid").on(
      table.orderItemUuid,
    ),
    foreignKey({
      name: "fk_production_work_order_lines_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_lines_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [ProductionWorkOrders.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_lines_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_lines_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectProductionWorkOrders = InferSelectModel<
  typeof ProductionWorkOrders
>;
export type InsertProductionWorkOrders = InferInsertModel<
  typeof ProductionWorkOrders
>;
export type SelectProductionWorkOrderLines = InferSelectModel<
  typeof ProductionWorkOrderLines
>;
export type InsertProductionWorkOrderLines = InferInsertModel<
  typeof ProductionWorkOrderLines
>;
