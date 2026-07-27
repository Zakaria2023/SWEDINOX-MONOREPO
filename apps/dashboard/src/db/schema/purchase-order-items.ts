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
import { orderLineStatuses, stockUnits } from "../../lib/enums";
import { PurchaseOrders } from "./purchase-orders";
import { Products } from "./products";

export const PurchaseOrderItems = mysqlTable(
  "PurchaseOrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),

    // ── Line identity / state ─────────────────────────────────────────────────
    lineNumber: int("line_number"),
    status: mysqlEnum("status", orderLineStatuses).default("in_progress"),
    purchaser: varchar("purchaser", { length: 255 }),

    // ── Physical attributes ───────────────────────────────────────────────────
    unit: mysqlEnum("unit", stockUnits).default("st"),
    qualityCode: varchar("quality_code", { length: 100 }),
    stockCategory: varchar("stock_category", { length: 100 }),
    options: varchar("options", { length: 255 }),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),

    // ── Quantities ────────────────────────────────────────────────────────────
    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyReceived: decimal("qty_received", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    reservedQty: decimal("reserved_qty", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgPurchased: decimal("kg_purchased", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // ── Receipt ───────────────────────────────────────────────────────────────
    receiptDate: date("receipt_date", { mode: "string" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_order_items_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_purchase_order_items_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_purchase_order_items_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_purchase_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectPurchaseOrderItems = InferSelectModel<
  typeof PurchaseOrderItems
>;
export type InsertPurchaseOrderItems = InferInsertModel<
  typeof PurchaseOrderItems
>;
