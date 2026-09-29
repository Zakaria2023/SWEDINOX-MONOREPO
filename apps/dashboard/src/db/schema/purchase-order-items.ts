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
    // Whether the order has actually gone to the supplier, and whether they
    // have acknowledged it — each either zero or the whole line, so a partial
    // confirmation can be held. The reference shows them as "Qty ordered" and
    // "Qty confirmed", and its confusingly named "Received Qty" on the
    // receivals overview is this confirmed figure rather than a receipt.
    qtyOrdered: decimal("qty_ordered", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyConfirmed: decimal("qty_confirmed", { precision: 15, scale: 3 }).default(
      "0.000",
    ),

    reservedQty: decimal("reserved_qty", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    // ── The two weights ───────────────────────────────────────────────────────
    //
    // 🔴 A purchase line is billed on the weighed kilos, not the theoretical
    // ones. Proved on purchase order `402532` (Holland Stainless Int) on
    // 29-9-2026, to the cent, on both its lines:
    //
    //     line 10   Kg(p) 22 608   Kg(a) 22 655   @ EUR 1.970,00 / TN
    //               22 608 x 1,97 = 44 537,76     <- not the amount
    //               22 655 x 1,97 = 44 630,35     <- the amount
    //
    //     line 20   Kg(p) 25 434   Kg(a) 25 829
    //               25 829 x 1,97 = 50 883,13     <- exact
    //
    // And the document follows: Materials 95 513,48, VAT at 21 % 20 057,83,
    // incl. 115 571,31, and the header's own total weight 48 484 — which is the
    // sum of Kg(a), not of Kg(p) (that would be 48 042).
    //
    // `kgPurchased` is the THEORETICAL weight: piece weight from the product's
    // density times the quantity. 22 608 / 160 = 141,30 kg a plate, which is
    // exactly 3,0 x 1,5 x 0,004 x 7 850.
    //
    // `kgActual` is what the weighbridge said, rolled up from the receivals.
    // 22 655 / 160 = 141,59. The reference insists on it: reporting a `Weighed`
    // order back with the theoretical figure untouched raises
    // "Geen gewogen gewicht — the work order must be reported back with weighed
    // weights", which is the mechanism that makes the two diverge at all.
    //
    // Nothing is billed on `kgActual` until goods actually arrive, so it stays
    // null until the first receival reports a weight. `billingWeightKg` picks
    // between them.
    kgPurchased: decimal("kg_purchased", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }),

    // ── Price ─────────────────────────────────────────────────────────────────
    // What was agreed to pay the supplier. Held at four decimals because a
    // purchase price is quoted per kilo or per metre far more often than per
    // piece, and rounding it to cents before multiplying by a tonne loses real
    // money.
    //
    // A received lot is valued at this price, which is what makes a sales order
    // line's cost — and therefore its margin — a true figure rather than a
    // stand-in for the replacement price.
    // What the supplier quoted before discounts, and the two percentages that
    // come off it — the group's, then the line's. The reference shows all four
    // side by side on a quote line, with net as the result rather than a
    // separate figure somebody types.
    grossPrice: decimal("gross_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    groupDiscountPercent: decimal("group_discount_percent", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    lineDiscountPercent: decimal("line_discount_percent", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    netPrice: decimal("net_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    priceUnit: varchar("price_unit", { length: 10 }),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

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
    index("idx_purchase_order_items_created_at_id").on(
      table.createdAt,
      table.id,
    ),
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
