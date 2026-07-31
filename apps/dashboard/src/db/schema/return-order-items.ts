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
import {
  orderLineStatuses,
  returnOrderReasons,
  stockUnits,
} from "../../lib/enums";
import { Complaints } from "./complaints";
import { Orders } from "./orders";
import { Products } from "./products";
import { ReturnOrders } from "./return-orders";

// Line items of a return order ("Return lines"). Pricing/cost columns are
// stored; derived figures (profit, margins, price -/- cost) are computed in
// the view, not persisted.
export const ReturnOrderItems = mysqlTable(
  "ReturnOrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    returnOrderUuid: char("return_order_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }),
    complaintUuid: char("complaint_uuid", { length: 36 }),
    // The original sales order/line this return came from.
    originalOrderUuid: char("original_order_uuid", { length: 36 }),
    originalOrderLine: int("original_order_line"),
    // The exact order line coming back. The order/line-number pair above
    // identifies it for a human; this identifies it for the credit note, which
    // has to find what was billed and must not guess.
    originalOrderItemUuid: char("original_order_item_uuid", { length: 36 }),

    lineNumber: int("line_number"),
    lineType: varchar("line_type", { length: 50 }),
    lineStatus: mysqlEnum("line_status", orderLineStatuses).default(
      "in_progress",
    ),
    reference: varchar("reference", { length: 255 }),

    // ── Physical attributes ───────────────────────────────────────────────────
    unit: mysqlEnum("unit", stockUnits).default("st"),
    quantity: decimal("quantity", { precision: 15, scale: 3 }).default("0.000"),
    returnQty: decimal("return_qty", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    weightKg: decimal("weight_kg", { precision: 15, scale: 2 }).default("0.00"),
    qualityCode: varchar("quality_code", { length: 100 }),
    stockCategory: varchar("stock_category", { length: 100 }),
    options: varchar("options", { length: 255 }),
    country: varchar("country", { length: 100 }),
    returnReason: mysqlEnum("return_reason", returnOrderReasons),

    // ── Pricing / cost ────────────────────────────────────────────────────────
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    priceUnit: varchar("price_unit", { length: 10 }),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    // Fixed sales price / average purchase price reference points.
    fsp: decimal("fsp", { precision: 15, scale: 2 }).default("0.00"),
    app: decimal("app", { precision: 15, scale: 2 }).default("0.00"),
    replacementPrice: decimal("replacement_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

    deliveryDate: date("delivery_date", { mode: "string" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_return_order_items_return_order_uuid").on(
      table.returnOrderUuid,
    ),
    index("idx_return_order_items_product_uuid").on(table.productUuid),
    index("idx_return_order_items_complaint_uuid").on(table.complaintUuid),
    index("idx_return_order_items_original_order_uuid").on(
      table.originalOrderUuid,
    ),
    index("idx_return_order_items_original_order_item_uuid").on(
      table.originalOrderItemUuid,
    ),
    foreignKey({
      name: "fk_return_order_items_return_order",
      columns: [table.returnOrderUuid],
      foreignColumns: [ReturnOrders.uuid],
    }),
    foreignKey({
      name: "fk_return_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_return_order_items_complaint",
      columns: [table.complaintUuid],
      foreignColumns: [Complaints.uuid],
    }),
    foreignKey({
      name: "fk_return_order_items_original_order",
      columns: [table.originalOrderUuid],
      foreignColumns: [Orders.uuid],
    }),
  ],
);

export type SelectReturnOrderItems = InferSelectModel<typeof ReturnOrderItems>;
export type InsertReturnOrderItems = InferInsertModel<typeof ReturnOrderItems>;
