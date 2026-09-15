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
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  orderMethods,
  orderStatuses,
  orderTypes,
  orderWeightTypes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";

export const Orders = mysqlTable(
  "Orders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ────────────────────────────────────────────────────────────────
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contactUuid: char("contact_uuid", { length: 36 }),
    orderMethod: mysqlEnum("order_method", orderMethods),
    customerRef: varchar("customer_ref", { length: 255 }),
    leaveCustomer: boolean("leave_customer").default(false),
    ourReference: varchar("our_reference", { length: 255 }),
    seller: varchar("seller", { length: 255 }),
    projectUuid: char("project_uuid", { length: 36 }),
    priceDate: date("price_date"),
    orderCategory: varchar("order_category", { length: 100 }),
    handlingBlocked: boolean("handling_blocked").default(false),
    // The reference's first rung: a freshly typed document that nobody has
    // released. 71 of its 2.091 headers sit here, and every header with no
    // lines yet is one of them.
    status: mysqlEnum("status", orderStatuses)
      .default("provisional")
      .notNull(),

    // ── Order type ────────────────────────────────────────────────────────────
    // The `Normal` dropdown at the top of the reference's own order-type block.
    // 1.933 Normal, 29 Call-off and 8 Rush across its Production capacity
    // details export.
    //
    // ⚠️ Not the `Order type` column on the revenue screens. That one is the
    // line's sourcing — `OrderItems.sourceType` — rolled up. The reference uses
    // one header for two fields.
    orderType: mysqlEnum("order_type", orderTypes).default("normal").notNull(),
    isPickup: boolean("is_pickup").default(false),
    isIncidental: boolean("is_incidental").default(false),
    isConsignment: boolean("is_consignment").default(false),
    consignmentDuration: varchar("consignment_duration", { length: 100 }),
    isInternalProduction: boolean("is_internal_production").default(false),
    isCustomerMaterial: boolean("is_customer_material").default(false),
    weightType: mysqlEnum("weight_type", orderWeightTypes),
    isOverlength: boolean("is_overlength").default(false),
    isPrinted: boolean("is_printed").default(false),
    isMailed: boolean("is_mailed").default(false),
    isFaxed: boolean("is_faxed").default(false),

    // ── Delivery ──────────────────────────────────────────────────────────────
    // Disabled when isPickup = true
    deliveryTerms: mysqlEnum("delivery_terms", deliveryTerms),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
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

    // ── Finances ──────────────────────────────────────────────────────────────
    showNetPrice: boolean("show_net_price").default(false),
    scrapSurchargeSeparate: boolean("scrap_surcharge_separate").default(false),
    calculateVatIfApplicable: boolean("calculate_vat_if_applicable").default(
      false,
    ),
    financialBlockage: boolean("financial_blockage").default(false),
    // Set by hand on the order form rather than by the credit rule. The
    // reference keeps the two apart (`SALES_FINANCE.FINANCIALBLOCKMANUAL`): a
    // hold somebody chose is not re-decided by arithmetic, and the queue says
    // which kind each one is.
    financialBlockManual: boolean("financial_block_manual").default(false),
    // The order was edited after a financial release. The reference flags this
    // (`CHANGEDAFTERFINANCIALDEBLOCK`) because a release covers the order as it
    // stood; once it changes, the credit rule runs again before goods leave.
    changedAfterFinancialDeblock: boolean(
      "changed_after_financial_deblock",
    ).default(false),
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

    // ── Summary (computed snapshot, read-only in the UI) ─────────────────────
    // The same rollup a quote header carries, so an order reports its worth
    // without every overview having to re-aggregate its lines — and so the
    // margin recorded on the day it was placed survives later revaluations.
    materialsRevenue: decimal("materials_revenue", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    materialsProfit: decimal("materials_profit", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    materialsProfitReplPrice: decimal("materials_profit_repl_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    surchargesRevenue: decimal("surcharges_revenue", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    surchargesProfit: decimal("surcharges_profit", {
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
    avgKiloPrice: decimal("avg_kilo_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    totalWeightKg: decimal("total_weight_kg", {
      precision: 10,
      scale: 2,
    }).default("0.00"),

    // ── Remark ────────────────────────────────────────────────────────────────
    remarks: text("remarks"),

    // ── Documents ─────────────────────────────────────────────────────────────
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_orders_company_uuid").on(table.companyUuid),
    // Status and delivery date are what the overview narrows by; the financial
    // blockage is a two-value column that /financially-blocked selects on
    // directly, so it is worth an index of its own.
    index("idx_orders_status").on(table.status),
    index("idx_orders_delivery_date").on(table.deliveryDate),
    index("idx_orders_financial_blockage").on(table.financialBlockage),
    index("idx_orders_created_at_id").on(table.createdAt, table.id),
    index("idx_orders_contact_uuid").on(table.contactUuid),
    index("idx_orders_project_uuid").on(table.projectUuid),
    index("idx_orders_delivery_address_uuid").on(table.deliveryAddressUuid),
    index("idx_orders_billing_address_uuid").on(table.billingAddressUuid),
    foreignKey({
      name: "fk_orders_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_orders_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_orders_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_orders_billing_address",
      columns: [table.billingAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectOrders = InferSelectModel<typeof Orders>;
export type InsertOrders = InferInsertModel<typeof Orders>;

export const OrderSurcharges = mysqlTable(
  "OrderSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderUuid: char("order_uuid", { length: 36 }),
    companyUuid: char("company_uuid", { length: 36 }),

    order: int("order").default(0),
    description: mysqlEnum("description", invoiceSurchargeDescriptions),
    surcharge: decimal("surcharge", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    unit: varchar("unit", { length: 50 }),
    fromValue: decimal("from_value", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    unitIndication: varchar("unit_indication", { length: 50 }),
    tierUnit: mysqlEnum("tier_unit", contractTierUnits),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),
    thirdParties: boolean("third_parties").default(false),
    companyCode: varchar("company_code", { length: 100 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_order_surcharges_order_uuid").on(table.orderUuid),
    index("idx_order_surcharges_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_order_surcharges_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_order_surcharges_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectOrderSurcharges = InferSelectModel<typeof OrderSurcharges>;
export type InsertOrderSurcharges = InferInsertModel<typeof OrderSurcharges>;
