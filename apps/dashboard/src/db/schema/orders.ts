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
  orderMethods,
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

    // ── Order type ────────────────────────────────────────────────────────────
    isPickup: boolean("is_pickup").default(false),
    isIncidental: boolean("is_incidental").default(false),
    isConsignment: boolean("is_consignment").default(false),
    consignmentDuration: varchar("consignment_duration", { length: 100 }),
    isInternalProduction: boolean("is_internal_production").default(false),
    isKlantMateriaal: boolean("is_klant_materiaal").default(false),
    weightType: mysqlEnum("weight_type", orderWeightTypes),
    isOverlengte: boolean("is_overlengte").default(false),
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
