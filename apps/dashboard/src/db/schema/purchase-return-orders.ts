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
  contractTierUnits,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  purchaseOrderStatuses,
  purchaseOrderTypes,
  purchaseReturnOrderReasons,
  transportModes,
  warehouseTransportRegions,
} from "../../lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";
import { PurchaseOrders } from "./purchase-orders";

export const PurchaseReturnOrders = mysqlTable(
  "PurchaseReturnOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ────────────────────────────────────────────────────────────────
    supplierUuid: char("supplier_uuid", { length: 36 }).notNull(),
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    purchaseOrderReference: varchar("purchase_order_reference", { length: 255 }),
    complaintRef: varchar("complaint_ref", { length: 255 }),
    contactUuid: char("contact_uuid", { length: 36 }),
    purchaser: varchar("purchaser", { length: 255 }),
    purchaseOrderType: mysqlEnum("purchase_order_type", purchaseOrderTypes),
    // 🔴 The purchase ladder, not the sales return's. A purchase return is
    // never `received` — its goods are *delivered* back to the supplier: the
    // three in the reference (`IR950008`, `IR950030`, `IR950033`) all end in
    // `Delivered`, and `Par. return` opens a new one as `Provisional`
    // (7-10-2026). After that the supplier's credit note makes it `invoiced`.
    status: mysqlEnum("status", purchaseOrderStatuses).default("provisional"),
    isPrinted: boolean("is_printed").default(false),
    isMailed: boolean("is_mailed").default(false),
    isFaxed: boolean("is_faxed").default(false),

    // ── Invoicing ─────────────────────────────────────────────────────────────
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),

    // ── Delivery ──────────────────────────────────────────────────────────────
    returnDate: date("return_date"),
    returnReason: mysqlEnum("return_reason", purchaseReturnOrderReasons),
    isDropOff: boolean("is_drop_off").default(false),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
    pickupAddress: varchar("pickup_address", { length: 255 }),

    // ── Logistics ─────────────────────────────────────────────────────────────
    completeDelivery: boolean("complete_delivery").default(false),
    vehicleWithCrane: boolean("vehicle_with_crane").default(false),
    vehicleWithCanopy: boolean("vehicle_with_canopy").default(false),
    bundlingSeparate: boolean("bundling_separate").default(false),
    unloadingWarehousePerLine: boolean("unloading_warehouse_per_line").default(
      false,
    ),
    transportRegion: mysqlEnum("transport_region", warehouseTransportRegions),
    transportMode: mysqlEnum("transport_mode", transportModes),
    pickupAfterTime: varchar("pickup_after_time", { length: 5 }),
    pickupForTime: varchar("pickup_for_time", { length: 5 }),
    maxLengthMm: int("max_length_mm"),
    maxBundleWeightKg: decimal("max_bundle_weight_kg", {
      precision: 10,
      scale: 2,
    }),

    // ── Summary (computed snapshot, read-only in the UI) ─────────────────────
    materialsRevenue: decimal("materials_revenue", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    optionsRevenue: decimal("options_revenue", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    surchargesRevenue: decimal("surcharges_revenue", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    totalExclVat: decimal("total_excl_vat", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    totalInclVat: decimal("total_incl_vat", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    totalWeightKg: decimal("total_weight_kg", {
      precision: 10,
      scale: 2,
    }).default("0.00"),

    // ── Remarks ───────────────────────────────────────────────────────────────
    remarks: text("remarks"),

    // ── Documents ─────────────────────────────────────────────────────────────
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_return_orders_supplier_uuid").on(table.supplierUuid),
    index("idx_purchase_return_orders_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_purchase_return_orders_contact_uuid").on(table.contactUuid),
    index("idx_purchase_return_orders_delivery_address_uuid").on(
      table.deliveryAddressUuid,
    ),
    foreignKey({
      name: "fk_purchase_return_orders_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_orders_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_orders_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_orders_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export const PurchaseReturnOrderSurcharges = mysqlTable(
  "PurchaseReturnOrderSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseReturnOrderUuid: char("purchase_return_order_uuid", { length: 36 }),
    companyUuid: char("company_uuid", { length: 36 }),

    order: int("order").default(0).notNull(),
    description: mysqlEnum("description", invoiceSurchargeDescriptions),
    surcharge: decimal("surcharge", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    unit: varchar("unit", { length: 50 }),
    fromValue: decimal("from_value", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    unitIndication: varchar("unit_indication", { length: 50 }),
    tierUnit: mysqlEnum("tier_unit", contractTierUnits),
    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    profit: decimal("profit", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    thirdParties: boolean("third_parties").default(false).notNull(),
    companyCode: varchar("company_code", { length: 100 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_return_order_surcharges_pro_uuid").on(
      table.purchaseReturnOrderUuid,
    ),
    index("idx_purchase_return_order_surcharges_company_uuid").on(
      table.companyUuid,
    ),
    foreignKey({
      name: "fk_purchase_return_order_surcharges_purchase_return_order",
      columns: [table.purchaseReturnOrderUuid],
      foreignColumns: [PurchaseReturnOrders.uuid],
    }),
    foreignKey({
      name: "fk_purchase_return_order_surcharges_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectPurchaseReturnOrders = InferSelectModel<
  typeof PurchaseReturnOrders
>;
export type InsertPurchaseReturnOrders = InferInsertModel<
  typeof PurchaseReturnOrders
>;
export type SelectPurchaseReturnOrderSurcharges = InferSelectModel<
  typeof PurchaseReturnOrderSurcharges
>;
export type InsertPurchaseReturnOrderSurcharges = InferInsertModel<
  typeof PurchaseReturnOrderSurcharges
>;
