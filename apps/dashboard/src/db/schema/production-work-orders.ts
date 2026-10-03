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
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  machineOptionTypes,
  packagingTypes,
  remainderCategories,
  stockUnits,
  workOrderStatuses,
} from "../../lib/enums";
import { Companies } from "./companies";
import { Machines } from "./machines";
import { OrderItems } from "./order-items";
import { Products } from "./products";
import { Stock } from "./stock";
import { Warehouses } from "./warehouses";

/**
 * A job for a machine: run this option over these goods on this day.
 *
 * The floor reads its work grouped day first, then by the option the machine is
 * set up for, then by the order — so a run without a planned date or an option
 * appears on nobody's list.
 *
 * The material is expected to be at the machine already: a warehouse Fetching
 * order is what brings it there, which is why a production line's `from` is the
 * machine's own location rather than the rack the steel came off. Report a run
 * before its fetch lands and the machine location simply goes negative, which is
 * true and visible rather than blocked.
 */
export const ProductionWorkOrders = mysqlTable(
  "ProductionWorkOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The number the floor calls this job by, drawn from the same counter the
    // warehouse uses: raising the work for a sales order hands out consecutive
    // numbers across both kinds in one go, so a picking order, a fetch and the
    // production run that follows them read as 305838, 305839, 305840.
    number: int("number").notNull().unique(),

    machineUuid: char("machine_uuid", { length: 36 }),

    // What the machine does to the goods. This decides how the run is reported
    // back: an option that cuts has to balance its kilos, one that only treats
    // the pieces it was handed does not — see machineOptionCuts.
    option: mysqlEnum("option", machineOptionTypes),

    // A second operation layered on the machine's own.
    //
    // 🔴 `Extra options` on the reference's `Production workorders` overview,
    // read 2-10-2026: `Laser Foil` on nine of eleven runs whose `Machine` was
    // `Slijpen/Foliën`. The machine says what it does; this says what else was
    // asked for on top.
    extraOption: mysqlEnum("extra_option", machineOptionTypes),

    // 🔑 The picking that fetched the steel this run works on.
    //
    // Every production work order in the reference is paired with a warehouse
    // one numbered exactly **N−1** — 303126/303125, 316707/316706,
    // 327353/327352, nine for nine on 2-10-2026 — and the reference stores the
    // link rather than leaving it to be inferred from the numbers. That is the
    // whole reason the two share a counter (see `nextWorkOrderNumbers`): a
    // production job is raised as a pair, picking first.
    //
    // ⚠️ Do not reconstruct this by subtracting one from the number. The
    // numbers happen to be consecutive because the pair is allocated together;
    // that is a consequence of the design, not the design itself.
    previousWarehouseWorkOrderUuid: char("previous_warehouse_wo_uuid", {
      length: 36,
    }),

    // ⚠️ A *planned* date, never a creation date, and never a floor under the
    // date work is reported on. Two of eleven production runs in the reference
    // were reported **before** the date on the order — `327292` dated 21-9-2026
    // reported 18-9, `327027` dated 23-9 reported 16-9. The work was done early
    // and nobody moved the plan. Do not validate `reportedAt >= plannedDate`.
    plannedDate: date("planned_date", { mode: "string" }),

    status: mysqlEnum("status", workOrderStatuses).notNull().default("new"),

    // When the run was frozen and its papers printed.
    releasedAt: timestamp("released_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_work_orders_machine_uuid").on(table.machineUuid),
    // The overview narrows by day, then by option, then by status.
    index("idx_production_work_orders_planned_date").on(table.plannedDate),
    index("idx_production_work_orders_option_status").on(
      table.option,
      table.status,
    ),
    foreignKey({
      name: "fk_production_work_orders_machine",
      columns: [table.machineUuid],
      foreignColumns: [Machines.uuid],
    }),
  ],
);

/**
 * One thing the machine has to make.
 *
 * A line is stated in what comes *out*, not what goes in: 304 pieces at 966,5 kg
 * describes the sheared plates, while the coil they are cut from is named by the
 * picks. That is why a cutting run's piece counts do not tie back — two plates
 * can legitimately become five — and why the kilos are what has to reconcile.
 */
export const ProductionWorkOrderLines = mysqlTable(
  "ProductionWorkOrderLines",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),

    // Two different numbers, both shown. `lineNumber` is the line's own name on
    // the run — cancelling one leaves a gap, so they are not 1..n — while
    // `itemNumber` is the order line it was raised for, counted in tens.
    lineNumber: int("line_number"),
    itemNumber: int("item_number"),

    // What this run is fulfilling. Null on a run raised for stock rather than
    // for a customer, which is a job with nobody waiting on it.
    orderItemUuid: char("order_item_uuid", { length: 36 }),
    orderNumber: varchar("order_number", { length: 50 }),
    companyUuid: char("company_uuid", { length: 36 }),

    productUuid: char("product_uuid", { length: 36 }),
    productCode: varchar("product_code", { length: 100 }),

    // Finishing sold on top of the machine's own option — a UV foil applied on
    // the same pass. It names work, not a second run.
    extraOptions: varchar("extra_options", { length: 255 }),

    status: mysqlEnum("status", workOrderStatuses).notNull().default("new"),

    // Three places, not two. The goods are taken from the machine, the finished
    // work goes to `to`, and whatever is left over goes `back` to the rack it
    // came off so it can be sold again.
    fromLocationUuid: char("from_location_uuid", { length: 36 }),
    toLocationUuid: char("to_location_uuid", { length: 36 }),
    backLocationUuid: char("back_location_uuid", { length: 36 }),

    length: int("length"),
    width: int("width"),
    thickness: decimal("thickness", { precision: 10, scale: 2 }),

    qtyPlanned: decimal("qty_planned", { precision: 10, scale: 3 }),
    qtyActual: decimal("qty_actual", { precision: 10, scale: 3 }),
    // The unit can change through the machine: a coil goes in weighed and comes
    // out counted, so what was planned and what was made are recorded apart.
    unitPlanned: mysqlEnum("unit_planned", stockUnits),
    unitActual: mysqlEnum("unit_actual", stockUnits),
    kgPlanned: decimal("kg_planned", { precision: 10, scale: 2 }),
    kgActual: decimal("kg_actual", { precision: 10, scale: 2 }),

    charge: varchar("charge", { length: 100 }),
    dateFinished: date("date_finished", { mode: "string" }),

    deliverOn: date("deliver_on", { mode: "string" }),
    isPickup: boolean("is_pickup").notNull().default(false),
    rush: boolean("rush").notNull().default(false),
    priority: int("priority"),

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
      name: "fk_production_work_order_lines_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [ProductionWorkOrders.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_lines_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
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
    foreignKey({
      name: "fk_production_work_order_lines_from_location",
      columns: [table.fromLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_lines_to_location",
      columns: [table.toLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_lines_back_location",
      columns: [table.backLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

/**
 * A lot taken to the machine — what the run consumes.
 *
 * A treatment is reported line by line, so its picks name the line they were
 * fetched for. A cut is reported for the whole run at once, because once two
 * coils are on the same bed there is no saying which line a given piece came
 * off; those picks carry no line.
 */
export const ProductionWorkOrderPicks = mysqlTable(
  "ProductionWorkOrderPicks",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),
    workOrderLineUuid: char("work_order_line_uuid", { length: 36 }),

    stockUuid: char("stock_uuid", { length: 36 }),
    fromLocationUuid: char("from_location_uuid", { length: 36 }),
    toLocationUuid: char("to_location_uuid", { length: 36 }),

    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 })
      .notNull()
      .default("0.000"),
    // Null until reported. Zero is a real answer — the floor looked and found
    // nothing — so it has to stay distinguishable from "not yet said".
    qtyActual: decimal("qty_actual", { precision: 15, scale: 3 }),
    kgPlanned: decimal("kg_planned", { precision: 15, scale: 2 }),
    // Weighed, not calculated. The balance a cut has to close is struck on
    // these figures, so they have to be what the scale said.
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }),

    length: int("length"),
    width: int("width"),
    thickness: decimal("thickness", { precision: 10, scale: 2 }),
    charge: varchar("charge", { length: 100 }),
    internalCharge: varchar("internal_charge", { length: 100 }),
    internalBatch: varchar("internal_batch", { length: 100 }),

    executedAt: timestamp("executed_at"),
    executedByUserId: varchar("executed_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_work_order_picks_work_order_uuid").on(
      table.workOrderUuid,
    ),
    index("idx_production_work_order_picks_line_uuid").on(
      table.workOrderLineUuid,
    ),
    index("idx_production_work_order_picks_stock_uuid").on(table.stockUuid),
    foreignKey({
      name: "fk_production_work_order_picks_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [ProductionWorkOrders.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_picks_line",
      columns: [table.workOrderLineUuid],
      foreignColumns: [ProductionWorkOrderLines.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_picks_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_picks_from_location",
      columns: [table.fromLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_picks_to_location",
      columns: [table.toLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

/**
 * What a cut left behind: the offcut and the swarf.
 *
 * Both are weighed, because the run only closes when everything fetched comes
 * out again as goods plus remainders. The category is what decides their fate —
 * an offcut goes back to a rack at the material's own cost and can be sold
 * again, scrap goes to the scrap location at nothing — so recording one as the
 * other either writes off good steel or shelves swarf as stock.
 */
export const ProductionWorkOrderRemainders = mysqlTable(
  "ProductionWorkOrderRemainders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),

    category: mysqlEnum("category", remainderCategories).notNull(),

    // Scrap is booked as its own article rather than as the product it fell off
    // — swarf is sold by the tonne to a merchant, not as plate.
    productUuid: char("product_uuid", { length: 36 }),

    quantity: decimal("quantity", { precision: 15, scale: 3 })
      .notNull()
      .default("0.000"),
    unit: mysqlEnum("unit", stockUnits),
    kg: decimal("kg", { precision: 15, scale: 2 }).notNull().default("0.00"),

    length: int("length"),
    width: int("width"),
    toLocationUuid: char("to_location_uuid", { length: 36 }),
    charge: varchar("charge", { length: 100 }),
    internalCharge: varchar("internal_charge", { length: 100 }),
    remark: varchar("remark", { length: 255 }),

    // The lot this became once the run was reported, so a remainder can be
    // traced to the steel that is now on the shelf.
    stockUuid: char("stock_uuid", { length: 36 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_work_order_remainders_work_order_uuid").on(
      table.workOrderUuid,
    ),
    foreignKey({
      name: "fk_production_work_order_remainders_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [ProductionWorkOrders.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_remainders_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_remainders_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_production_work_order_remainders_to_location",
      columns: [table.toLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

/**
 * The returnable packaging a run's goods went out on. One row per kind, unique
 * per kind so a second entry corrects the count rather than doubling it.
 */
export const ProductionWorkOrderPackagings = mysqlTable(
  "ProductionWorkOrderPackagings",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),
    packaging: mysqlEnum("packaging", packagingTypes).notNull(),
    quantity: int("quantity").notNull(),
    specification: varchar("specification", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_work_order_packagings_work_order_uuid").on(
      table.workOrderUuid,
    ),
    unique("uq_production_work_order_packagings_kind").on(
      table.workOrderUuid,
      table.packaging,
    ),
    foreignKey({
      name: "fk_production_work_order_packagings_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [ProductionWorkOrders.uuid],
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
export type SelectProductionWorkOrderPicks = InferSelectModel<
  typeof ProductionWorkOrderPicks
>;
export type InsertProductionWorkOrderPicks = InferInsertModel<
  typeof ProductionWorkOrderPicks
>;
export type SelectProductionWorkOrderRemainders = InferSelectModel<
  typeof ProductionWorkOrderRemainders
>;
export type InsertProductionWorkOrderRemainders = InferInsertModel<
  typeof ProductionWorkOrderRemainders
>;
export type SelectProductionWorkOrderPackagings = InferSelectModel<
  typeof ProductionWorkOrderPackagings
>;
export type InsertProductionWorkOrderPackagings = InferInsertModel<
  typeof ProductionWorkOrderPackagings
>;
