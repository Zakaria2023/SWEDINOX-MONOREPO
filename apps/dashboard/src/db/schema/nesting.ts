import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  datetime,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { OrderItems } from "./order-items";

// Nesting ("Nesten") — the Logistics nesting overview: the sheet-metal
// counterpart to sawing layouts. Each row hangs off an order line (which
// carries the order, company, product, dimensions, quantities and line
// status) and adds the nesting/sawing plan, the delivery plan, the sawing
// geometry and the material-fetch side used to cut the nested parts.
export const Nesting = mysqlTable(
  "Nesting",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The order line this nest belongs to. Order #, order type, company,
    // product, dimensions, quantities, unit, line status/type, kg and
    // theoretical weight are all derived from it.
    orderItemUuid: char("order_item_uuid", { length: 36 }).notNull(),

    // Material qualification shown on this report ("Kwaliteit" / "Categorie").
    quality: varchar("quality", { length: 100 }),
    category: varchar("category", { length: 100 }),

    // Flags: sawing-spec required and fixed dimension.
    sawingSpec: boolean("sawing_spec").default(false),
    fixedDimension: boolean("fixed_dimension").default(false),

    // Amount still to saw and the sawing work-order status ("New").
    toSaw: decimal("to_saw", { precision: 15, scale: 3 }),
    sawingWorkOrderStatus: varchar("sawing_work_order_status", { length: 50 }),

    // Production/delivery planning: start date, planned/delivered quantities
    // and their unit, planned/actual delivery dates and the delivery status.
    productionStartingDate: date("production_starting_date"),
    plannedDeliveredQty: decimal("planned_delivered_qty", {
      precision: 15,
      scale: 3,
    }),
    deliveredQty: decimal("delivered_qty", { precision: 15, scale: 3 }),
    deliveryUnit: varchar("delivery_unit", { length: 10 }),
    deliveryDatePlanned: date("delivery_date_planned"),
    deliveryDateActual: date("delivery_date_actual"),
    deliveryStatus: varchar("delivery_status", { length: 100 }),

    // Option quantity for this line ("Option Qty").
    optionQty: decimal("option_qty", { precision: 15, scale: 3 }),

    // Nesting/sawing plan: the sawing work order and its line, the nest and
    // the sawing machine ("LASER 1").
    sawingWorkOrder: varchar("sawing_work_order", { length: 100 }),
    sawingWorkOrderLine: varchar("sawing_work_order_line", { length: 100 }),
    nest: varchar("nest", { length: 255 }),
    sawingMachine: varchar("sawing_machine", { length: 100 }),

    // Sawing geometry: drill-hole count, left/right saw angles, bundles
    // ("Bls"), whether it saws standing, the sawing type and the raw angle
    // spec.
    drillingHoles: int("drilling_holes"),
    leftSawAngle: decimal("left_saw_angle", { precision: 6, scale: 2 }),
    rightSawAngle: decimal("right_saw_angle", { precision: 6, scale: 2 }),
    bundles: decimal("bundles", { precision: 15, scale: 3 }),
    standing: boolean("standing").default(false),
    sawingType: varchar("sawing_type", { length: 100 }),
    sawingAngles: varchar("sawing_angles", { length: 100 }),

    // When the nested material is transported.
    transportDate: datetime("transport_date", { mode: "string" }),

    // Fetch side — retrieving the raw sheet from stock to feed the nest: date,
    // code, line, status, quantity, product/description, the raw length and
    // the residual length left over.
    fetchDate: date("fetch_date"),
    fetchCode: varchar("fetch_code", { length: 50 }),
    fetchLine: int("fetch_line"),
    fetchStatus: varchar("fetch_status", { length: 50 }),
    fetchQty: decimal("fetch_qty", { precision: 15, scale: 3 }),
    fetchProduct: varchar("fetch_product", { length: 100 }),
    fetchDescription: varchar("fetch_description", { length: 255 }),
    fetchLength: decimal("fetch_length", { precision: 15, scale: 3 }),
    residualLength: decimal("residual_length", { precision: 15, scale: 3 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_nesting_order_item_uuid").on(table.orderItemUuid),
    index("idx_nesting_production_starting_date").on(
      table.productionStartingDate,
    ),
    foreignKey({
      name: "fk_nesting_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
  ],
);

export type SelectNesting = InferSelectModel<typeof Nesting>;
export type InsertNesting = InferInsertModel<typeof Nesting>;
