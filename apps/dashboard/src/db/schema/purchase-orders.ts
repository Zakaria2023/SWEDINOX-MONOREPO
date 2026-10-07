import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseOrderStatuses,
  purchaseOrderTypes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";
import { PurchaseQuotes } from "./purchase-quotes";

export const PurchaseOrders = mysqlTable(
  "PurchaseOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ────────────────────────────────────────────────────────────────
    // The supplier uuid is the company uuid that is supplying the goods or services for this purchase order
    supplierUuid: char("supplier_uuid", { length: 36 }).notNull(),
    agentUuid: char("agent_uuid", { length: 36 }),
    contactUuid: char("contact_uuid", { length: 36 }),

    // The supplier quote that was awarded, when the order came from one. This
    // is the audit trail behind the purchase price: the lot received against
    // this order is valued at that price, and every downstream margin depends
    // on it, so being able to point at the quote it was agreed on matters.
    purchaseQuoteUuid: char("purchase_quote_uuid", { length: 36 }),
    // Purchaser here is the Clerk user ID that is logged in to the system and is creating the purchase order
    purchaser: varchar("purchaser", { length: 255 }),
    reference: varchar("reference", { length: 255 }),
    ourReference: varchar("our_reference", { length: 255 }),
    orderCategory: varchar("order_category", { length: 100 }),

    // ── Purchase order type ───────────────────────────────────────────────────
    purchaseOrderType: mysqlEnum("purchase_order_type", purchaseOrderTypes),
    weightType: mysqlEnum("weight_type", orderWeightTypes),
    isOverlength: boolean("is_overlength").default(false),
    isPrinted: boolean("is_printed").default(false),
    isMailed: boolean("is_mailed").default(false),
    isFaxed: boolean("is_faxed").default(false),
    messageSentViaStaalWeb: boolean("message_sent_via_staalweb").default(false),
    // Held back on purpose. The three flags above say how the order reached
    // the supplier; this one says a buyer decided it should not — a phoned
    // order, a hold while a price is renegotiated — so the "still to be sent"
    // list can leave it alone instead of nagging about it forever.
    deliberatelyNotSent: boolean("deliberately_not_sent").default(false),
    doNotPrintPrices: boolean("do_not_print_prices").default(false),

    // ── Finances ──────────────────────────────────────────────────────────────
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),

    // ── Delivery ──────────────────────────────────────────────────────────────
    deliveryTerms: mysqlEnum("delivery_terms", deliveryTerms),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
    arrangeTransport: boolean("arrange_transport").default(false),
    pickupDropoffCdPurchases: boolean("pickup_dropoff_cd_purchases").default(
      false,
    ),
    supplierAddressUuid: char("supplier_address_uuid", { length: 36 }),
    deliveryType: mysqlEnum("delivery_type", deliveryTypes).default("date"),
    deliveryDate: date("delivery_date"),
    deliveryWeek: int("delivery_week"),
    deliveryYear: int("delivery_year"),
    deliveryRemark: varchar("delivery_remark", { length: 255 }),

    // ── Logistics ─────────────────────────────────────────────────────────────
    completeDelivery: boolean("complete_delivery").default(false),
    transportBlockage: boolean("transport_blockage").default(false),
    vehicleWithCrane: boolean("vehicle_with_crane").default(false),
    vehicleWithCanopy: boolean("vehicle_with_canopy").default(false),
    bundlingSeparate: boolean("bundling_separate").default(false),
    transportRegion: varchar("transport_region", { length: 100 }),
    maxLengthMm: int("max_length_mm"),
    maxBundleWeightKg: decimal("max_bundle_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    deliveryAfterTime: varchar("delivery_after_time", { length: 5 }),
    deliverForTime: varchar("deliver_for_time", { length: 5 }),
    transportMode: varchar("transport_mode", { length: 100 }),

    // ── Summary / listing fields ────────────────────────────────────────────
    status: mysqlEnum("status", purchaseOrderStatuses)
      .default("released")
      .notNull(),
    // `Confirm` and `Pre-notify` are stamps, not rungs — the reference's
    // header ladder has neither word (7-10-2026). They record when the
    // supplier acknowledged the order and when it advised the delivery.
    confirmedAt: timestamp("confirmed_at"),
    preNotifiedAt: timestamp("pre_notified_at"),
    forOrder: varchar("for_order", { length: 255 }),
    orderDate: date("order_date", { mode: "string" }),
    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    weightKg: decimal("weight_kg", { precision: 12, scale: 3 })
      .default("0.000")
      .notNull(),
    confirmationReference: varchar("confirmation_reference", { length: 255 }),
    confirmationDate: date("confirmation_date", { mode: "string" }),
    copiedFrom: varchar("copied_from", { length: 255 }),
    internalReference: varchar("internal_reference", { length: 255 }),
    inkoper: varchar("inkoper", { length: 255 }),
    purchaserInitials: varchar("purchaser_initials", { length: 50 }),

    // ── Remarks ───────────────────────────────────────────────────────────────
    remarks: text("remarks"),

    // ── Documents ─────────────────────────────────────────────────────────────
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_orders_supplier_uuid").on(table.supplierUuid),
    // Status is what /purchase-orders-to-be-received is a view of, and the two
    // dates are what the overview narrows by.
    index("idx_purchase_orders_status").on(table.status),
    index("idx_purchase_orders_order_date").on(table.orderDate),
    index("idx_purchase_orders_delivery_date").on(table.deliveryDate),
    index("idx_purchase_orders_created_at_id").on(table.createdAt, table.id),
    index("idx_purchase_orders_agent_uuid").on(table.agentUuid),
    index("idx_purchase_orders_contact_uuid").on(table.contactUuid),
    index("idx_purchase_orders_delivery_address_uuid").on(
      table.deliveryAddressUuid,
    ),
    index("idx_purchase_orders_supplier_address_uuid").on(
      table.supplierAddressUuid,
    ),
    index("idx_purchase_orders_purchase_quote_uuid").on(
      table.purchaseQuoteUuid,
    ),
    foreignKey({
      name: "fk_purchase_orders_purchase_quote",
      columns: [table.purchaseQuoteUuid],
      foreignColumns: [PurchaseQuotes.uuid],
    }),
    foreignKey({
      name: "fk_purchase_orders_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_orders_agent",
      columns: [table.agentUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_orders_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_purchase_orders_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_purchase_orders_supplier_address",
      columns: [table.supplierAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectPurchaseOrders = InferSelectModel<typeof PurchaseOrders>;
export type InsertPurchaseOrders = InferInsertModel<typeof PurchaseOrders>;
