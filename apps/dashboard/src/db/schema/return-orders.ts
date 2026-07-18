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
  invoicePaymentTerms,
  returnOrderReasons,
  returnOrderStatuses,
  transportModes,
  warehouseTransportRegions,
} from "../../lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";
import { Orders } from "./orders";

export const ReturnOrders = mysqlTable(
  "ReturnOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ────────────────────────────────────────────────────────────────
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    orderUuid: char("order_uuid", { length: 36 }),
    orderReference: varchar("order_reference", { length: 255 }),
    complaintRef: varchar("complaint_ref", { length: 255 }),
    contactUuid: char("contact_uuid", { length: 36 }),
    customerRef: varchar("customer_ref", { length: 255 }),
    ourReference: varchar("our_reference", { length: 255 }),
    status: mysqlEnum("status", returnOrderStatuses).default("open"),
    orderDate: date("order_date", { mode: "string" }),
    handlingBlocked: boolean("handling_blocked").default(false),
    isPrinted: boolean("is_printed").default(false),
    isMailed: boolean("is_mailed").default(false),
    isFaxed: boolean("is_faxed").default(false),

    // ── Reception ─────────────────────────────────────────────────────────────
    returnDate: date("return_date"),
    isPickup: boolean("is_pickup").default(false),
    pickupAddress: varchar("pickup_address", { length: 255 }),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),

    // ── Reason ────────────────────────────────────────────────────────────────
    returnReason: mysqlEnum("return_reason", returnOrderReasons),

    // ── Finances ──────────────────────────────────────────────────────────────
    calculateVatIfApplicable: boolean("calculate_vat_if_applicable").default(
      false,
    ),
    invoiceBlockage: boolean("invoice_blockage").default(false),
    onlyTotalAmountOnInvoice: boolean("only_total_amount_on_invoice").default(
      false,
    ),
    includeOptionPricesInMaterialPrices: boolean(
      "include_option_prices_in_material_prices",
    ).default(false),
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),
    billingAddressUuid: char("billing_address_uuid", { length: 36 }),
    blockingReason: varchar("blocking_reason", { length: 255 }),

    // ── Logistics ─────────────────────────────────────────────────────────────
    completeDelivery: boolean("complete_delivery").default(false),
    transportBlockage: boolean("transport_blockage").default(false),
    vehicleWithCrane: boolean("vehicle_with_crane").default(false),
    vehicleWithCanopy: boolean("vehicle_with_canopy").default(false),
    bundlingSeparate: boolean("bundling_separate").default(false),
    transportRegion: mysqlEnum("transport_region", warehouseTransportRegions),
    maxLengthMm: int("max_length_mm"),
    maxBundleWeightKg: decimal("max_bundle_weight_kg", {
      precision: 10,
      scale: 2,
    }),
    deliveryAfterTime: varchar("delivery_after_time", { length: 5 }),
    deliverForTime: varchar("deliver_for_time", { length: 5 }),
    transportMode: mysqlEnum("transport_mode", transportModes),

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
    index("idx_return_orders_company_uuid").on(table.companyUuid),
    index("idx_return_orders_order_uuid").on(table.orderUuid),
    index("idx_return_orders_contact_uuid").on(table.contactUuid),
    index("idx_return_orders_delivery_address_uuid").on(
      table.deliveryAddressUuid,
    ),
    index("idx_return_orders_billing_address_uuid").on(
      table.billingAddressUuid,
    ),
    foreignKey({
      name: "fk_return_orders_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_return_orders_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_return_orders_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_return_orders_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_return_orders_billing_address",
      columns: [table.billingAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectReturnOrders = InferSelectModel<typeof ReturnOrders>;
export type InsertReturnOrders = InferInsertModel<typeof ReturnOrders>;
