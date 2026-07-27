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
import { Companies } from "./companies";
import { Products } from "./products";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseOrderItems } from "./purchase-order-items";

// Goods received against a purchase order line. Backs both the "Purchase
// receivals" detail overview and the per-day "Receipts" overview.
export const PurchaseLineReceivals = mysqlTable(
  "PurchaseLineReceivals",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    purchaseOrderItemUuid: char("purchase_order_item_uuid", { length: 36 }),
    productUuid: char("product_uuid", { length: 36 }),
    // The supplier the goods came from.
    companyUuid: char("company_uuid", { length: 36 }),

    purchaseOrderCode: varchar("purchase_order_code", { length: 100 }),
    lineNumber: int("line_number"),
    lineStatus: mysqlEnum("line_status", orderLineStatuses).default(
      "in_progress",
    ),
    receiptStatus: varchar("receipt_status", { length: 100 }),
    options: varchar("options", { length: 255 }),

    // ── Quantities ────────────────────────────────────────────────────────────
    unit: mysqlEnum("unit", stockUnits).default("st"),
    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyActual: decimal("qty_actual", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    receivedQty: decimal("received_qty", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    priceQuantity: decimal("price_quantity", {
      precision: 15,
      scale: 3,
    }).default("0.000"),
    kgPlanned: decimal("kg_planned", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }).default("0.00"),
    lengthMm: int("length_mm"),

    // ── Amounts ───────────────────────────────────────────────────────────────
    lineAmount: decimal("line_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    invoicedPrice: decimal("invoiced_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),

    // ── Dates / people ────────────────────────────────────────────────────────
    receiptDate: date("receipt_date", { mode: "string" }),
    deliveryDatePlanned: date("delivery_date_planned", { mode: "string" }),
    deliveryDateActual: date("delivery_date_actual", { mode: "string" }),
    purchaser: varchar("purchaser", { length: 255 }),
    initials: varchar("initials", { length: 50 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_line_receivals_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_purchase_line_receivals_purchase_order_item_uuid").on(
      table.purchaseOrderItemUuid,
    ),
    index("idx_purchase_line_receivals_product_uuid").on(table.productUuid),
    index("idx_purchase_line_receivals_company_uuid").on(table.companyUuid),
    index("idx_purchase_line_receivals_receipt_date").on(table.receiptDate),
    foreignKey({
      name: "fk_purchase_line_receivals_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_purchase_line_receivals_purchase_order_item",
      columns: [table.purchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }),
    foreignKey({
      name: "fk_purchase_line_receivals_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_purchase_line_receivals_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectPurchaseLineReceivals = InferSelectModel<
  typeof PurchaseLineReceivals
>;
export type InsertPurchaseLineReceivals = InferInsertModel<
  typeof PurchaseLineReceivals
>;
