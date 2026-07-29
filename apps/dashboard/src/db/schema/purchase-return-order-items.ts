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
  purchaseReturnOrderReasons,
  stockUnits,
} from "../../lib/enums";
import { Complaints } from "./complaints";
import { Products } from "./products";
import { PurchaseOrderItems } from "./purchase-order-items";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseReturnOrders } from "./purchase-return-orders";
import { Stock } from "./stock";

// Line items of a purchase return order — goods going back to the supplier.
// The mirror of ReturnOrderItems: where a sales return brings stock back in at
// the value it left at, these take stock out of the lot it arrived in, at the
// price it was bought for.
export const PurchaseReturnOrderItems = mysqlTable(
  "PurchaseReturnOrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseReturnOrderUuid: char("purchase_return_order_uuid", {
      length: 36,
    }).notNull(),
    productUuid: char("product_uuid", { length: 36 }),
    complaintUuid: char("complaint_uuid", { length: 36 }),

    // The purchase order and line the goods came in on.
    originalPurchaseOrderUuid: char("original_purchase_order_uuid", {
      length: 36,
    }),
    originalPurchaseOrderLine: int("original_purchase_order_line"),
    // The exact ordered line going back. Identifies for the credit note what
    // the order/line-number pair only identifies for a human.
    originalPurchaseOrderItemUuid: char("original_purchase_order_item_uuid", {
      length: 36,
    }),
    // The lot the goods are drawn out of. A purchase receipt creates its own
    // lot, so sending goods back has an exact place to take them from — and an
    // exact valuation to reverse.
    stockUuid: char("stock_uuid", { length: 36 }),

    lineNumber: int("line_number"),
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
    returnReason: mysqlEnum("return_reason", purchaseReturnOrderReasons),

    // ── Pricing ───────────────────────────────────────────────────────────────
    // What we paid for it. A return credits back exactly that, never a price
    // renegotiated since.
    netPrice: decimal("net_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    priceUnit: varchar("price_unit", { length: 10 }),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

    returnDate: date("return_date", { mode: "string" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_return_order_items_return_order_uuid").on(
      table.purchaseReturnOrderUuid,
    ),
    index("idx_purchase_return_order_items_product_uuid").on(table.productUuid),
    index("idx_purchase_return_order_items_order_item_uuid").on(
      table.originalPurchaseOrderItemUuid,
    ),
    index("idx_purchase_return_order_items_stock_uuid").on(table.stockUuid),
    foreignKey({
      name: "fk_purchase_return_order_items_return_order",
      columns: [table.purchaseReturnOrderUuid],
      foreignColumns: [PurchaseReturnOrders.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_order_items_complaint",
      columns: [table.complaintUuid],
      foreignColumns: [Complaints.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_order_items_purchase_order",
      columns: [table.originalPurchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_order_items_purchase_order_item",
      columns: [table.originalPurchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_order_items_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
  ],
);

export type SelectPurchaseReturnOrderItems = InferSelectModel<
  typeof PurchaseReturnOrderItems
>;
export type InsertPurchaseReturnOrderItems = InferInsertModel<
  typeof PurchaseReturnOrderItems
>;
