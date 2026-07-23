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
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  contractTierUnits,
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseCompanyTypes,
  purchaseOrderTypes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";

export const PurchaseQuotes = mysqlTable(
  "PurchaseQuotes",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ────────────────────────────────────────────────────────────────
    // The company is either a supplier or an agent; companyType says which one.
    companyUuid: char("company_uuid", { length: 36 }),
    companyType: mysqlEnum("company_type", purchaseCompanyTypes),
    contactUuid: char("contact_uuid", { length: 36 }),
    // Purchaser here is the Clerk user ID that is logged in to the system and is creating the purchase quote
    purchaser: varchar("purchaser", { length: 255 }),
    reference: varchar("reference", { length: 255 }),
    ourReference: varchar("our_reference", { length: 255 }),
    orderCategory: varchar("order_category", { length: 100 }),

    // ── Quote ─────────────────────────────────────────────────────────────────
    quoteNumber: varchar("quote_number", { length: 100 }),
    quoteDate: date("quote_date"),
    validUntil: date("valid_until"),

    // ── Purchase order type ───────────────────────────────────────────────────
    purchaseOrderType: mysqlEnum("purchase_order_type", purchaseOrderTypes),
    weightType: mysqlEnum("weight_type", orderWeightTypes),
    isOverlength: boolean("is_overlength").default(false),
    isConsignment: boolean("is_consignment").default(false),

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

    // ── Summary (computed snapshot, read-only in the UI) ─────────────────────
    materials: decimal("materials", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    optionsAmount: decimal("options_amount", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    surcharges: decimal("surcharges", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
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
    // ── Documents ─────────────────────────────────────────────────────────────
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_quotes_company_uuid").on(table.companyUuid),
    index("idx_purchase_quotes_contact_uuid").on(table.contactUuid),
    index("idx_purchase_quotes_delivery_address_uuid").on(
      table.deliveryAddressUuid,
    ),
    index("idx_purchase_quotes_supplier_address_uuid").on(
      table.supplierAddressUuid,
    ),
    foreignKey({
      name: "fk_purchase_quotes_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_quotes_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_purchase_quotes_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_purchase_quotes_supplier_address",
      columns: [table.supplierAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectPurchaseQuotes = InferSelectModel<typeof PurchaseQuotes>;
export type InsertPurchaseQuotes = InferInsertModel<typeof PurchaseQuotes>;

// ── Surcharges ──────────────────────────────────────────────────────────────
// Line items behind the "Surcharges" panel — additional charges (transport,
// handling, third-party fees, etc.) layered on top of the quote.
export const PurchaseQuoteSurcharges = mysqlTable(
  "PurchaseQuoteSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseQuoteUuid: char("purchase_quote_uuid", { length: 36 }),
    order: int("order").default(0).notNull(),

    description: varchar("description", { length: 255 }),
    surchargeValue: decimal("surcharge_value", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    unit: varchar("unit", { length: 50 }),

    tierFrom: decimal("tier_from", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    tierUntil: decimal("tier_until", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    tierUnit: mysqlEnum("tier_unit", contractTierUnits),

    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    profit: decimal("profit", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    thirdParty: boolean("third_party").default(false).notNull(),
    companyCode: varchar("company_code", { length: 100 }),
    companyUuid: char("company_uuid", { length: 36 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_quote_surcharges_purchase_quote_uuid").on(
      table.purchaseQuoteUuid,
    ),
    index("idx_purchase_quote_surcharges_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_purchase_quote_surcharges_purchase_quote",
      columns: [table.purchaseQuoteUuid],
      foreignColumns: [PurchaseQuotes.uuid],
    }),
    foreignKey({
      name: "fk_purchase_quote_surcharges_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectPurchaseQuoteSurcharges = InferSelectModel<
  typeof PurchaseQuoteSurcharges
>;
export type InsertPurchaseQuoteSurcharges = InferInsertModel<
  typeof PurchaseQuoteSurcharges
>;
