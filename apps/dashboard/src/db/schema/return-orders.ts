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
    // Whether the document is meant to go to the customer at all, and whether
    // somebody deliberately held it back. The reference carries both, and its
    // `Send` column -- still to be sent -- is the two of them with the
    // already-sent flags: must be sent, not held back, not yet printed,
    // mailed or faxed. Its own cross-tab proves the reading: `Send` is true on
    // 1 482 rows, exactly the must-send-and-not-held-back set of 1 709 less
    // the 227 that had already gone out.
    mustBeSent: boolean("must_be_sent").default(true).notNull(),
    deliberatelyNotSent: boolean("deliberately_not_sent")
      .default(false)
      .notNull(),
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
    // Status is the whole workflow of a return — raised, received, credited.
    index("idx_return_orders_status").on(table.status),
    index("idx_return_orders_return_date").on(table.returnDate),
    index("idx_return_orders_created_at_id").on(table.createdAt, table.id),
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

export const ReturnOrderSurcharges = mysqlTable(
  "ReturnOrderSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    returnOrderUuid: char("return_order_uuid", { length: 36 }),
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
    index("idx_return_order_surcharges_return_order_uuid").on(
      table.returnOrderUuid,
    ),
    index("idx_return_order_surcharges_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_return_order_surcharges_return_order",
      columns: [table.returnOrderUuid],
      foreignColumns: [ReturnOrders.uuid],
    }),
    foreignKey({
      name: "fk_return_order_surcharges_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectReturnOrders = InferSelectModel<typeof ReturnOrders>;
export type InsertReturnOrders = InferInsertModel<typeof ReturnOrders>;
export type SelectReturnOrderSurcharges = InferSelectModel<
  typeof ReturnOrderSurcharges
>;
export type InsertReturnOrderSurcharges = InferInsertModel<
  typeof ReturnOrderSurcharges
>;
