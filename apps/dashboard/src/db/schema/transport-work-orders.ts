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
  varchar,
} from "drizzle-orm/mysql-core";
import { transportDirections, tripStatuses } from "../../lib/enums";
import { Companies } from "./companies";
import { OrderItems } from "./order-items";
import { Products } from "./products";

// Transport work orders — a trip (Rit) with one line per stop/destination and
// the order lines carried on it.
export const TransportWorkOrders = mysqlTable("TransportWorkOrders", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  tripNumber: int("trip_number"),
  date: date("date", { mode: "string" }),
  vehicle: varchar("vehicle", { length: 255 }),
  status: mysqlEnum("status", tripStatuses).default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const TransportWorkOrderLines = mysqlTable(
  "TransportWorkOrderLines",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),
    destinationCompanyUuid: char("destination_company_uuid", { length: 36 }),
    postalCode: varchar("postal_code", { length: 20 }),
    productUuid: char("product_uuid", { length: 36 }),
    productCode: varchar("product_code", { length: 100 }),
    // The order line being carried. The panel prints it as `Item` and it is
    // what makes a trip line answerable from the order: without it a line can
    // only be matched back by order number and product code, which is not
    // unique on an order that sells the same article twice.
    orderItemUuid: char("order_item_uuid", { length: 36 }),
    orderNumber: varchar("order_number", { length: 50 }),
    action: varchar("action", { length: 100 }),
    sourceStatus: varchar("source_status", { length: 100 }),
    status: mysqlEnum("status", tripStatuses).notNull().default("new"),

    // Which way the goods travel. A trip collects as well as delivers, so the
    // line cannot be read as outbound by default.
    direction: mysqlEnum("direction", transportDirections)
      .notNull()
      .default("deliver"),

    // The consignment note the line travels under, and the thing that groups
    // lines onto a trip: on order `100742` three lines share bill of lading
    // `300804` on one journey. The trip is the lorry's day; this is the
    // paperwork for one drop on it, so a trip visiting three customers
    // produces three of these.
    //
    // Deliberately not a foreign key to a table of its own — the reference
    // issues the number at loading and prints it, and nothing else hangs off
    // it. Grouping by the string is what the panel does.
    billOfLading: varchar("bill_of_lading", { length: 50 }),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    qtyPlanned: decimal("qty_planned", { precision: 12, scale: 3 }),
    qtyActual: decimal("qty_actual", { precision: 12, scale: 3 }),
    qtyLoaded: decimal("qty_loaded", { precision: 12, scale: 3 }),
    kgPlanned: decimal("kg_planned", { precision: 12, scale: 2 }),
    kgActual: decimal("kg_actual", { precision: 12, scale: 2 }),
    colli: int("colli"),
    priority: int("priority"),
    fromLocation: varchar("from_location", { length: 255 }),
    toLocation: varchar("to_location", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_transport_work_order_lines_work_order_uuid").on(
      table.workOrderUuid,
    ),
    index("idx_transport_work_order_lines_destination_company_uuid").on(
      table.destinationCompanyUuid,
    ),
    index("idx_transport_work_order_lines_product_uuid").on(table.productUuid),
    index("idx_transport_work_order_lines_order_item_uuid").on(
      table.orderItemUuid,
    ),
    // The panel groups a trip's lines by consignment note, and a bill of
    // lading is the number a driver or a customer quotes when they ring up.
    index("idx_transport_work_order_lines_bill_of_lading").on(
      table.billOfLading,
    ),
    foreignKey({
      name: "fk_transport_work_order_lines_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [TransportWorkOrders.uuid],
    }),
    foreignKey({
      name: "fk_transport_work_order_lines_destination_company",
      columns: [table.destinationCompanyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_transport_work_order_lines_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_transport_work_order_lines_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
  ],
);

export type SelectTransportWorkOrders = InferSelectModel<
  typeof TransportWorkOrders
>;
export type InsertTransportWorkOrders = InferInsertModel<
  typeof TransportWorkOrders
>;
export type SelectTransportWorkOrderLines = InferSelectModel<
  typeof TransportWorkOrderLines
>;
export type InsertTransportWorkOrderLines = InferInsertModel<
  typeof TransportWorkOrderLines
>;
