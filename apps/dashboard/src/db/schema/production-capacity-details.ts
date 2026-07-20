import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { OrderItems } from "./order-items";

// Production capacity details — the Logistics "Production capacity details"
// overview: the per-order-line production/sawing drill-down behind Production
// capacity. Each row hangs off an order line (which already carries the order,
// product, dimensions, quantities, delivery and line status), and adds the
// sawing/production-specific attributes that only exist for production work.
export const ProductionCapacityDetails = mysqlTable(
  "ProductionCapacityDetails",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The order line this production detail belongs to. The order #, order
    // type, company, product, dimensions, quantities (planned/actual), unit,
    // delivery status/date and line status/type are all derived from it.
    orderItemUuid: char("order_item_uuid", { length: 36 }).notNull(),

    // Material qualification shown on this report ("Kwaliteit" / "Categorie").
    quality: varchar("quality", { length: 100 }),
    category: varchar("category", { length: 100 }),

    // Whether the piece is a fixed dimension ("Fixed dim.").
    fixedDimension: boolean("fixed_dimension").default(false),

    // Planning dates: when production starts, the planned delivery, and the
    // transport date.
    productionStartingDate: date("production_starting_date"),
    plannedDeliveryDate: date("planned_delivery_date"),
    transportDate: date("transport_date"),

    // Sawing plan: speed, amount still to saw, the sawing work order(s) and
    // the sawing method/type.
    sawingSpeed: decimal("sawing_speed", { precision: 15, scale: 2 }),
    toSaw: decimal("to_saw", { precision: 15, scale: 3 }),
    sawingWorkOrder: varchar("sawing_work_order", { length: 100 }),
    sawingWorkOrderLine: varchar("sawing_work_order_line", { length: 100 }),
    sawingMethod: varchar("sawing_method", { length: 100 }),
    sawingType: varchar("sawing_type", { length: 100 }),

    // Sawing geometry: left/right saw angles, whether it saws standing, and
    // the raw angle spec.
    leftSawAngle: decimal("left_saw_angle", { precision: 6, scale: 2 }),
    rightSawAngle: decimal("right_saw_angle", { precision: 6, scale: 2 }),
    standing: boolean("standing").default(false),
    sawingAngles: varchar("sawing_angles", { length: 100 }),

    // Bundles ("Bls") and bundles plus remainder ("Bls+P").
    bundles: decimal("bundles", { precision: 15, scale: 3 }),
    bundlesPlusRemainder: decimal("bundles_plus_remainder", {
      precision: 15,
      scale: 3,
    }),

    // Extra work: whether sawing/drilling is required and the drill-hole count.
    sawing: boolean("sawing").default(false),
    drilling: boolean("drilling").default(false),
    drillingHoles: int("drilling_holes"),

    // Option quantity for this line ("Option Qty").
    optionQty: decimal("option_qty", { precision: 15, scale: 3 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_production_capacity_details_order_item_uuid").on(
      table.orderItemUuid,
    ),
    index("idx_production_capacity_details_production_starting_date").on(
      table.productionStartingDate,
    ),
    foreignKey({
      name: "fk_production_capacity_details_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
  ],
);

export type SelectProductionCapacityDetails = InferSelectModel<
  typeof ProductionCapacityDetails
>;
export type InsertProductionCapacityDetails = InferInsertModel<
  typeof ProductionCapacityDetails
>;
