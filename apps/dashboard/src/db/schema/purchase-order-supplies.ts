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
import { purchaseOrderSupplyStatuses } from "../../lib/enums";
import { Products } from "./products";
import { PurchaseOrders } from "./purchase-orders";
import { Stock } from "./stock";

// 🔑 `Supplies` on a `Processing` purchase order: the lot we hand the
// processor (C8 of PLANNED-CODE-CHANGES-8, captured on 400066 and 402401,
// 8-10-2026). The reference's panel reads `Blocked · Delivery date · Product ·
// Length · Width · Thickness · Kg(p) · Options · Qty(p) · U · Picked · Qty(a) ·
// Kg(a) · Bill of lading · Status · Code · Charge · Purchase order · Receipt
// date · M1(p) · M1(a)` — the last five are the supplied lot's own identity,
// read through `stockUuid` rather than copied.
//
// The supply goes out like a sale: a picking moves the lot to the loading bay
// (`315201`, `5G` → `Laad`), a lorry takes it on a bill of lading, and it reads
// `Delivered`. The processed metal comes back as the order's own lines.
export const PurchaseOrderSupplies = mysqlTable(
  "PurchaseOrderSupplies",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }).notNull(),
    stockUuid: char("stock_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    blocked: boolean("blocked").default(false),
    deliveryDate: date("delivery_date", { mode: "string" }),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    options: varchar("options", { length: 255 }),

    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgPlanned: decimal("kg_planned", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    m1Planned: decimal("m1_planned", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    // `Picked`, then what actually went out.
    qtyPicked: decimal("qty_picked", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyActual: decimal("qty_actual", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }).default("0.00"),
    m1Actual: decimal("m1_actual", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    billOfLading: varchar("bill_of_lading", { length: 60 }),
    // What the lot was worth on its way out — the value the processed metal
    // comes back carrying.
    valueEur: decimal("value_eur", { precision: 15, scale: 2 }).default("0.00"),
    status: mysqlEnum("status", purchaseOrderSupplyStatuses).default("new"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_order_supplies_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_purchase_order_supplies_stock_uuid").on(table.stockUuid),
    foreignKey({
      name: "fk_purchase_order_supplies_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_purchase_order_supplies_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_purchase_order_supplies_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectPurchaseOrderSupplies = InferSelectModel<
  typeof PurchaseOrderSupplies
>;
export type InsertPurchaseOrderSupplies = InferInsertModel<
  typeof PurchaseOrderSupplies
>;
