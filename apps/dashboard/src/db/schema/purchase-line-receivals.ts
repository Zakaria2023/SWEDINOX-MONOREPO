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
import { orderLineStatuses, receiptStatuses, stockUnits } from "../../lib/enums";
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
    // How far the reception has got. `workorders_created` is the state that
    // separates a promised delivery from goods on a shelf: the Unloading work
    // order exists but nobody has approved it yet, so nothing is in stock.
    // See RECEIPT_STATUS_META.
    receiptStatus: mysqlEnum("receipt_status", receiptStatuses).default("new"),
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
    // ── Lot identity, as the reception records it ─────────────────────────
    // `Charge aanpassen...` on a reception edits three fields, and the
    // WarehouseWorkOrderLines already hold all three — the reception, which is
    // where they are first keyed, held none.
    //
    // The supplier's melt number. Dirty free text: across 2.247 lots it is
    // blank 607 times, `nvt` 145, `-` 33 and `ntv` 32 — a typo of `nvt` that
    // somebody made three dozen times. All four mean nothing.
    charge: varchar("charge", { length: 60 }),
    // Ours, chosen from a registry rather than typed: two-digit year plus four
    // characters (25AAWO, 23EHGI, 21GFFI).
    internalCharge: varchar("internal_charge", { length: 60 }),
    plateNumber: varchar("plate_number", { length: 60 }),

    // Goods-in can be held until its mill certificate is attached. The
    // `Partijregistratie instellingen` dialogue offers exactly one setting —
    // "ignore document obligations for the above receipt" — and warns that the
    // line may then drop out of view. That is the mechanism behind the
    // `documents` block reason.
    documentObligationWaived: boolean("document_obligation_waived").default(
      false,
    ),

    // Who called the delivery ahead, by initials (AVD), and the code they
    // quoted. `intern` on an internal movement, a 300xxx bill of lading
    // otherwise.
    preReportedBy: varchar("pre_reported_by", { length: 20 }),
    preNotifyCode: varchar("pre_notify_code", { length: 60 }),
    billOfLading: varchar("bill_of_lading", { length: 60 }),

    receiptDate: date("receipt_date", { mode: "string" }),
    // Stamped when the supplier pre-advises a delivery, which is what the
    // order's Pre-notify action does.
    preAnnouncedDeliveryDate: date("pre_announced_delivery_date", {
      mode: "string",
    }),
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
