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
  counterOrderPriorities,
  counterOrderStatuses,
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  orderLineStatuses,
  orderMethods,
  stockUnits,
  transportModes,
  warehouseTransportRegions,
} from "@/lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";
import { Products } from "./products";

export const CounterOrders = mysqlTable(
  "CounterOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ──────────────────────────────────────────────────────────────
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contactUuid: char("contact_uuid", { length: 36 }),
    customerRef: varchar("customer_ref", { length: 255 }),
    leaveCustomer: boolean("leave_customer").default(false),
    orderMethod: mysqlEnum("order_method", orderMethods),
    ourReference: varchar("our_reference", { length: 255 }),
    seller: varchar("seller", { length: 255 }),
    projectUuid: char("project_uuid", { length: 36 }),
    status: mysqlEnum("status", counterOrderStatuses).default("open"),
    priority: mysqlEnum("priority", counterOrderPriorities).default("normal"),
    priceDate: date("price_date", { mode: "string" }),
    orderDate: date("order_date", { mode: "string" }),
    handlingBlocked: boolean("handling_blocked").default(false),
    printPickingSlips: boolean("print_picking_slips").default(true),

    // ── Order type ──────────────────────────────────────────────────────────
    isPickup: boolean("is_pickup").default(false),
    isIncidental: boolean("is_incidental").default(false),
    isOverlength: boolean("is_overlength").default(false),
    isPrinted: boolean("is_printed").default(false),
    isMailed: boolean("is_mailed").default(false),
    isFaxed: boolean("is_faxed").default(false),

    // ── Delivery ────────────────────────────────────────────────────────────
    deliveryTerms: mysqlEnum("delivery_terms", deliveryTerms),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
    deliveryType: mysqlEnum("delivery_type", deliveryTypes).default("date"),
    deliveryDate: date("delivery_date", { mode: "string" }),
    deliveryWeek: int("delivery_week"),
    deliveryYear: int("delivery_year"),
    deliveryRemark: varchar("delivery_remark", { length: 255 }),

    // ── Logistics ───────────────────────────────────────────────────────────
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

    // ── Finances ────────────────────────────────────────────────────────────
    showNetPrice: boolean("show_net_price").default(false),
    scrapSurchargeSeparate: boolean("scrap_surcharge_separate").default(false),
    calculateVatIfApplicable: boolean("calculate_vat_if_applicable").default(
      false,
    ),
    financialBlockage: boolean("financial_blockage").default(false),
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

    // ── Summary ─────────────────────────────────────────────────────────────
    amountExVat: decimal("amount_ex_vat", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    weightKg: decimal("weight_kg", { precision: 12, scale: 3 }).default(
      "0.000",
    ),
    gainPercent: decimal("gain_percent", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    remarks: text("remarks"),

    // ── Documents ───────────────────────────────────────────────────────────
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_counter_orders_company_uuid").on(table.companyUuid),
    index("idx_counter_orders_status").on(table.status),
    index("idx_counter_orders_order_date").on(table.orderDate),
    index("idx_counter_orders_created_at_id").on(table.createdAt, table.id),
    index("idx_counter_orders_contact_uuid").on(table.contactUuid),
    index("idx_counter_orders_project_uuid").on(table.projectUuid),
    index("idx_counter_orders_delivery_address_uuid").on(
      table.deliveryAddressUuid,
    ),
    index("idx_counter_orders_billing_address_uuid").on(
      table.billingAddressUuid,
    ),
    foreignKey({
      name: "fk_counter_orders_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_counter_orders_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_counter_orders_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_counter_orders_billing_address",
      columns: [table.billingAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export const CounterOrderSurcharges = mysqlTable(
  "CounterOrderSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    counterOrderUuid: char("counter_order_uuid", { length: 36 }),
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
    index("idx_counter_order_surcharges_counter_order_uuid").on(
      table.counterOrderUuid,
    ),
    index("idx_counter_order_surcharges_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_counter_order_surcharges_counter_order",
      columns: [table.counterOrderUuid],
      foreignColumns: [CounterOrders.uuid],
    }),
    foreignKey({
      name: "fk_counter_order_surcharges_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

// Line items of a counter order ("Order lines"). Pricing/cost columns are
// stored as entered; derived figures shown in the native grid (profit, margin)
// are recomputed in the view, not persisted here beyond what the grid edits.
export const CounterOrderItems = mysqlTable(
  "CounterOrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    counterOrderUuid: char("counter_order_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }),

    // ── Line identity / state ─────────────────────────────────────────────────
    lineNumber: int("line_number"),
    quoteLine: int("quote_line"),
    status: mysqlEnum("status", orderLineStatuses).default("in_progress"),
    deliveryDate: date("delivery_date", { mode: "string" }),
    description: varchar("description", { length: 255 }),
    levCode: varchar("lev_code", { length: 100 }),
    reference: varchar("reference", { length: 255 }),

    // ── Physical attributes ───────────────────────────────────────────────────
    unit: mysqlEnum("unit", stockUnits).default("st"),
    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyActual: decimal("qty_actual", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    lengthMm: int("length_mm"),
    kgPlanned: decimal("kg_planned", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }).default("0.00"),

    // ── Pricing / discounts ───────────────────────────────────────────────────
    grossPrice: decimal("gross_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceUnit: varchar("price_unit", { length: 10 }),
    lineDiscount: decimal("line_discount", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    groupDiscount: decimal("group_discount", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    commercialDiscount: decimal("commercial_discount", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    costs: decimal("costs", { precision: 15, scale: 2 }).default("0.00"),
    profitAmount: decimal("profit_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    profitPercent: decimal("profit_percent", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    profitTooLow: boolean("profit_too_low").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_counter_order_items_counter_order_uuid").on(
      table.counterOrderUuid,
    ),
    index("idx_counter_order_items_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_counter_order_items_counter_order",
      columns: [table.counterOrderUuid],
      foreignColumns: [CounterOrders.uuid],
    }),
    foreignKey({
      name: "fk_counter_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectCounterOrders = InferSelectModel<typeof CounterOrders>;
export type InsertCounterOrders = InferInsertModel<typeof CounterOrders>;
export type SelectCounterOrderItems = InferSelectModel<
  typeof CounterOrderItems
>;
export type InsertCounterOrderItems = InferInsertModel<
  typeof CounterOrderItems
>;
export type SelectCounterOrderSurcharges = InferSelectModel<
  typeof CounterOrderSurcharges
>;
export type InsertCounterOrderSurcharges = InferInsertModel<
  typeof CounterOrderSurcharges
>;
