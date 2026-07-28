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
  deliveryStatuses,
  orderItemStatuses,
  orderLineStatuses,
  stockUnits,
} from "../../lib/enums";
import { Orders } from "./orders";
import { Stock } from "./stock";
import { Products } from "./products";
import { PurchaseOrders } from "./purchase-orders";

export const OrderItems = mysqlTable(
  "OrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderUuid: char("order_uuid", { length: 36 }).notNull(),
    stockUuid: char("stock_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    // Amount reserved from stockUuid — never changes after creation. Consumed
    // in full when invoiced, or released in full when cancelled.
    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    status: mysqlEnum("status", orderItemStatuses)
      .default("reserved")
      .notNull(),

    // ── Line identity ─────────────────────────────────────────────────────────
    lineNumber: int("line_number"),
    lineType: varchar("line_type", { length: 50 }),
    seller: varchar("seller", { length: 255 }),

    // ── Fulfilment / delivery ─────────────────────────────────────────────────
    lineStatus: mysqlEnum("line_status", orderLineStatuses).default(
      "in_progress",
    ),
    deliveryStatus: mysqlEnum("delivery_status", deliveryStatuses).default(
      "not_ready",
    ),
    deliveryDate: date("delivery_date", { mode: "string" }),
    reservationDate: date("reservation_date", { mode: "string" }),
    isPickup: boolean("is_pickup").default(false),
    lastWarehouseWorkOrder: varchar("last_warehouse_work_order", {
      length: 100,
    }),

    // ── Blocking ──────────────────────────────────────────────────────────────
    commercialBlock: boolean("commercial_block").default(false),
    financialBlock: boolean("financial_block").default(false),
    transportBlock: boolean("transport_block").default(false),
    blockingReason: varchar("blocking_reason", { length: 255 }),

    // ── Physical attributes ───────────────────────────────────────────────────
    unit: mysqlEnum("unit", stockUnits).default("st"),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    options: varchar("options", { length: 255 }),

    // ── Quantities (planned / actual / call-off) in units and kg ──────────────
    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyActual: decimal("qty_actual", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyCallOff: decimal("qty_call_off", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgPlanned: decimal("kg_planned", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }).default("0.00"),
    kgCallOff: decimal("kg_call_off", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    qtyReserved: decimal("qty_reserved", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgReserved: decimal("kg_reserved", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // ── Purchase link (for lines drawn from a purchase order) ─────────────────
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    qtyPurchased: decimal("qty_purchased", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgPurchased: decimal("kg_purchased", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // ── Pricing ───────────────────────────────────────────────────────────────
    grossPrice: decimal("gross_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceUnit: varchar("price_unit", { length: 10 }),
    lineDiscount: decimal("line_discount", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    groupDiscount: decimal("group_discount", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

    // ── Cost basis ────────────────────────────────────────────────────────────
    // An order line is allocated to a specific stock lot, so unlike a quote it
    // knows exactly what the goods cost: the lot's own valuation price. That is
    // snapshotted here at reservation rather than read live, because a later
    // revaluation must not silently move the margin already recorded against a
    // shipped order.
    //
    // The replacement price is kept alongside it for the same reason quotes do:
    // profit against what it cost and profit against what re-buying it costs
    // today are different numbers, and a falling market makes the second the
    // honest one.
    costPrice: decimal("cost_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    costAmount: decimal("cost_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    replacementPrice: decimal("replacement_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),
    profitMargin: decimal("profit_margin", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    profitReplPrice: decimal("profit_repl_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    // Flagged when the line's margin falls under the product group's floor.
    profitTooLow: boolean("profit_too_low").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_order_items_order_uuid").on(table.orderUuid),
    index("idx_order_items_stock_uuid").on(table.stockUuid),
    index("idx_order_items_product_uuid").on(table.productUuid),
    index("idx_order_items_purchase_order_uuid").on(table.purchaseOrderUuid),
    foreignKey({
      name: "fk_order_items_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_order_items_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_order_items_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
  ],
);

export type SelectOrderItems = InferSelectModel<typeof OrderItems>;
export type InsertOrderItems = InferInsertModel<typeof OrderItems>;
