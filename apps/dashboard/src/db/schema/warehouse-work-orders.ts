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
  packagingTypes,
  workOrderStatuses,
  warehouseWorkOrderTypes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { OrderItems } from "./order-items";
import { Products } from "./products";
import { PurchaseOrderItems } from "./purchase-order-items";
import { Stock } from "./stock";
import { Warehouses } from "./warehouses";

/**
 * A job for the warehouse floor: move these goods from here to there.
 *
 * Every type is a move between two locations, and `null` on either side of a
 * line is the company boundary — goods arriving from outside, or leaving for
 * good. That is the only thing that changes how much stock the company holds;
 * every other type just changes where a lot sits.
 *
 * The order is raised as a basket lines can still be added to (`new`), frozen
 * and printed by releasing it, and closed line by line as the floor reports what
 * it actually picked. Nothing physical happens until that report — which is why
 * a released order can still be cancelled outright.
 */
export const WarehouseWorkOrders = mysqlTable(
  "WarehouseWorkOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The number the floor calls this job by. One counter across every type and
    // every warehouse, allocated at creation and never reused.
    number: int("number").notNull().unique(),

    warehouseUuid: char("warehouse_uuid", { length: 36 }).notNull(),

    // What kind of job this is, which decides the route the goods take and what
    // reporting it completed does to stock — see WAREHOUSE_WORK_ORDER_TYPE_META.
    type: mysqlEnum("type", warehouseWorkOrderTypes).notNull(),

    // The day the floor is meant to do it. Work is grouped by day first, so a
    // job without one would not appear on anybody's list.
    // ⚠️ A *planned* date, never a creation date, and never a floor under the
    // date work is reported on. Two of eleven production runs in the reference
    // were reported **before** the date on the order — `327292` dated 21-9-2026
    // reported 18-9, `327027` dated 23-9 reported 16-9. The work was done early
    // and nobody moved the plan. Do not validate `reportedAt >= plannedDate`.
    plannedDate: date("planned_date", { mode: "string" }),

    status: mysqlEnum("status", workOrderStatuses)
      .notNull()
      .default("new"),

    // When the basket was frozen and handed to the floor, and whether that
    // release printed stock labels — releasing without them is a deliberate
    // choice for goods that are already labelled.
    releasedAt: timestamp("released_at"),
    stockLabelsPrinted: boolean("stock_labels_printed").notNull().default(true),

    // `Created by` on the reference's `Warehouse workorders` overview — filled
    // on 11 560 of 11 625 rows. Clerk user id.
    createdByUserId: varchar("created_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouse_work_orders_warehouse_uuid").on(table.warehouseUuid),
    // The overview narrows by day, then by type, then by status, in that order.
    index("idx_warehouse_work_orders_planned_date").on(table.plannedDate),
    index("idx_warehouse_work_orders_type_status").on(
      table.type,
      table.status,
    ),
    foreignKey({
      name: "fk_warehouse_work_orders_warehouse",
      columns: [table.warehouseUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

/**
 * One lot's worth of the job.
 *
 * A line is not an order line — it is one stock lot allocated to one order line.
 * An order line for 300 pieces drawn from three different lots becomes three
 * lines here, which is why each carries its own charge, its own measured weight
 * and its own source location.
 */
export const WarehouseWorkOrderLines = mysqlTable(
  "WarehouseWorkOrderLines",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderUuid: char("work_order_uuid", { length: 36 }).notNull(),

    // The number the line is known by, which comes from the order line it
    // serves rather than from a counter of its own — so a work order's lines
    // are not necessarily 1..n.
    lineNumber: int("line_number"),

    // What this line is fulfilling. Null for the internal types — a relocation
    // or a count serves no customer.
    orderItemUuid: char("order_item_uuid", { length: 36 }),
    orderNumber: varchar("order_number", { length: 50 }),
    companyUuid: char("company_uuid", { length: 36 }),

    // The lot the goods come out of. Chosen when the order line is written
    // against stock, which is why a line can already name its charge before the
    // work order has been released.
    stockUuid: char("stock_uuid", { length: 36 }),
    productUuid: char("product_uuid", { length: 36 }),
    productCode: varchar("product_code", { length: 100 }),

    // What is being received, on an unloading. Goods arriving have no lot to
    // come out of, so the purchase line is what says whose they are and what
    // they cost — without it a receipt would put material on the shelf at no
    // value and make every margin drawn from it a fiction.
    purchaseOrderItemUuid: char("purchase_order_item_uuid", { length: 36 }),

    // 🔑 And the other thing an unloading can be receiving: goods coming back.
    //
    // Watched on 29-9-2026. Return order `290247` raised work order `327396` of
    // type **`Unloading`** — the same type as a supplier receipt — with
    // `Purchase order` reading `-leeg-`. There is no "return" movement type in
    // the reference: goods coming back use the same verb as goods arriving from
    // a mill, and one of these two columns says which cause it was.
    //
    // So an unloading with no purchase line is legal, and a schema that
    // insisted on one could not book a return at all. Exactly one of the two is
    // set; both empty is a receipt from nowhere and is refused when it is
    // reported.
    returnOrderItemUuid: char("return_order_item_uuid", { length: 36 }),

    status: mysqlEnum("status", workOrderStatuses)
      .notNull()
      .default("new"),

    // Where the goods are and where they are going. Null is the company
    // boundary: no source means they are arriving, no destination means they
    // are leaving.
    fromLocationUuid: char("from_location_uuid", { length: 36 }),
    toLocationUuid: char("to_location_uuid", { length: 36 }),

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
    // `Modified by` on the same overview: whoever last released, reported or
    // approved the line. Clerk user id.
    modifiedByUserId: varchar("modified_by_user_id", { length: 255 }),
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
    index("idx_warehouse_work_order_lines_order_item_uuid").on(
      table.orderItemUuid,
    ),
    index("idx_warehouse_work_order_lines_stock_uuid").on(table.stockUuid),
    index("idx_warehouse_work_order_lines_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_warehouse_work_order_lines_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [WarehouseWorkOrders.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_purchase_order_item",
      columns: [table.purchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_from_location",
      columns: [table.fromLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_lines_to_location",
      columns: [table.toLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

/**
 * One trip to one lot — the unit of work the floor actually performs.
 *
 * A line asks for a quantity; a pick says where it is coming from and, once
 * reported, how much of it was really there. Preparing a line splits it into
 * these rows ahead of time; reporting it completed fills in the actuals and is
 * what moves the stock. There are several because 28 pieces may genuinely have
 * to come out of three different lots.
 */
export const WarehouseWorkOrderPicks = mysqlTable(
  "WarehouseWorkOrderPicks",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    workOrderLineUuid: char("work_order_line_uuid", { length: 36 }).notNull(),

    // The lot this pick draws from. Null only where there is nothing to draw
    // from yet — an unloading, where the goods are arriving.
    stockUuid: char("stock_uuid", { length: 36 }),
    fromLocationUuid: char("from_location_uuid", { length: 36 }),
    toLocationUuid: char("to_location_uuid", { length: 36 }),

    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 })
      .notNull()
      .default("0.000"),
    // Null until the line is reported. Zero is a real answer — it is how a
    // delivery is cancelled — so it must be distinguishable from "not yet said".
    qtyActual: decimal("qty_actual", { precision: 15, scale: 3 }),
    kgPlanned: decimal("kg_planned", { precision: 15, scale: 2 }),
    // Weighed on the scale rather than calculated: two bundles of nominally
    // identical plate do not weigh the same, and the invoice follows the scale.
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }),

    length: int("length"),
    width: int("width"),
    thickness: decimal("thickness", { precision: 10, scale: 2 }),
    charge: varchar("charge", { length: 100 }),
    internalCharge: varchar("internal_charge", { length: 100 }),
    internalBatch: varchar("internal_batch", { length: 100 }),

    // Who did it and when — typed on the completion dialog, not inferred from
    // when the row happened to be written.
    executedAt: timestamp("executed_at"),
    executedByUserId: varchar("executed_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_warehouse_work_order_picks_line_uuid").on(
      table.workOrderLineUuid,
    ),
    index("idx_warehouse_work_order_picks_stock_uuid").on(table.stockUuid),
    foreignKey({
      name: "fk_warehouse_work_order_picks_line",
      columns: [table.workOrderLineUuid],
      foreignColumns: [WarehouseWorkOrderLines.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_picks_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_picks_from_location",
      columns: [table.fromLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
    foreignKey({
      name: "fk_warehouse_work_order_picks_to_location",
      columns: [table.toLocationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

/**
 * The returnable packaging a job's goods went out on — pallets, coils, bundles.
 *
 * One row per kind used, because a single load routinely mixes them. Unique per
 * kind so a second entry corrects the count rather than adding a duplicate.
 */
export const WarehouseWorkOrderPackagings = mysqlTable(
  "WarehouseWorkOrderPackagings",
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
    index("idx_warehouse_work_order_packagings_work_order_uuid").on(
      table.workOrderUuid,
    ),
    unique("uq_warehouse_work_order_packagings_kind").on(
      table.workOrderUuid,
      table.packaging,
    ),
    foreignKey({
      name: "fk_warehouse_work_order_packagings_work_order",
      columns: [table.workOrderUuid],
      foreignColumns: [WarehouseWorkOrders.uuid],
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
export type SelectWarehouseWorkOrderPicks = InferSelectModel<
  typeof WarehouseWorkOrderPicks
>;
export type InsertWarehouseWorkOrderPicks = InferInsertModel<
  typeof WarehouseWorkOrderPicks
>;
export type SelectWarehouseWorkOrderPackagings = InferSelectModel<
  typeof WarehouseWorkOrderPackagings
>;
export type InsertWarehouseWorkOrderPackagings = InferInsertModel<
  typeof WarehouseWorkOrderPackagings
>;
