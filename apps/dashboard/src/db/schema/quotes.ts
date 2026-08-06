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
import { Contracts } from "./contracts";
import { CustomerProjects } from "./customer-projects";

export const Quotes = mysqlTable(
  "Quotes",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ────────────────────────────────────────────────────────────────
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contactUuid: char("contact_uuid", { length: 36 }),
    customerRef: varchar("customer_ref", { length: 255 }),
    leaveCustomerRef: boolean("leave_customer_ref").default(false),
    requestMethod: mysqlEnum("request_method", orderMethods),
    ourReference: varchar("our_reference", { length: 255 }),
    seller: varchar("seller", { length: 255 }),
    projectUuid: char("project_uuid", { length: 36 }),
    contractUuid: char("contract_uuid", { length: 36 }),
    priceDate: date("price_date"),
    decisionDate: date("decision_date"),
    quoteDate: date("quote_date"),
    validityPeriodDays: int("validity_period_days"),
    validUntil: date("valid_until"),
    handlingBlocked: boolean("handling_blocked").default(false),

    // ── Order type ────────────────────────────────────────────────────────────
    isPickup: boolean("is_pickup").default(false),
    isIncidental: boolean("is_incidental").default(false),
    isConsignment: boolean("is_consignment").default(false),
    consignmentDuration: varchar("consignment_duration", { length: 100 }),
    consignmentDurationUnit: varchar("consignment_duration_unit", {
      length: 50,
    }),
    isInternalProduction: boolean("is_internal_production").default(false),
    isCustomerMaterial: boolean("is_customer_material").default(false),
    weightType: mysqlEnum("weight_type", orderWeightTypes),
    isOverlength: boolean("is_overlength").default(false),
    isPrinted: boolean("is_printed").default(false),
    isMailed: boolean("is_mailed").default(false),
    isFaxed: boolean("is_faxed").default(false),

    // ── Finances ──────────────────────────────────────────────────────────────
    showNetPrice: boolean("show_net_price").default(false),
    scrapSurchargeSeparate: boolean("scrap_surcharge_separate").default(false),
    calculateVatIfApplicable: boolean("calculate_vat_if_applicable").default(
      false,
    ),
    financialBlockage: boolean("financial_blockage").default(false),
    onlyTotalAmountOnInvoice: boolean("only_total_amount_on_invoice").default(
      false,
    ),
    doNotShowTotalAmount: boolean("do_not_show_total_amount").default(false),
    includeOptionPricesInMaterialPrices: boolean(
      "include_option_prices_in_material_prices",
    ).default(false),
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),
    billingAddressUuid: char("billing_address_uuid", { length: 36 }),
    blockingReason: varchar("blocking_reason", { length: 255 }),

    // ── Delivery ──────────────────────────────────────────────────────────────
    deliveryTerms: mysqlEnum("delivery_terms", deliveryTerms),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
    deliveryType: mysqlEnum("delivery_type", deliveryTypes).default("date"),
    deliveryDate: date("delivery_date"),
    deliveryWeek: int("delivery_week"),
    deliveryYear: int("delivery_year"),
    deliveryRemark: varchar("delivery_remark", { length: 255 }),

    // ── Follow-up ─────────────────────────────────────────────────────────────
    expired: boolean("expired").default(false),

    // ── Summary (computed snapshot, read-only in the UI) ─────────────────────
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
    optionsRevenue: decimal("options_revenue", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    optionsProfit: decimal("options_profit", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    optionsProfitReplPrice: decimal("options_profit_repl_price", {
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
    surchargesProfitReplPrice: decimal("surcharges_profit_repl_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    transportCosts: decimal("transport_costs", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    handlingCosts: decimal("handling_costs", {
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
    theorWeightKg: decimal("theor_weight_kg", {
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
    index("idx_quotes_company_uuid").on(table.companyUuid),
    // The overview filters and sorts on these: when the quote was given, how
    // long it stands, and whether it has run out. `expired` holds two values,
    // which is exactly the case an index earns its keep on for "show me the
    // live ones".
    index("idx_quotes_quote_date").on(table.quoteDate),
    index("idx_quotes_valid_until").on(table.validUntil),
    index("idx_quotes_expired").on(table.expired),
    index("idx_quotes_created_at_id").on(table.createdAt, table.id),
    index("idx_quotes_contact_uuid").on(table.contactUuid),
    index("idx_quotes_project_uuid").on(table.projectUuid),
    index("idx_quotes_contract_uuid").on(table.contractUuid),
    index("idx_quotes_delivery_address_uuid").on(table.deliveryAddressUuid),
    index("idx_quotes_billing_address_uuid").on(table.billingAddressUuid),
    foreignKey({
      name: "fk_quotes_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_quotes_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_quotes_project",
      columns: [table.projectUuid],
      foreignColumns: [CustomerProjects.uuid],
    }),
    foreignKey({
      name: "fk_quotes_contract",
      columns: [table.contractUuid],
      foreignColumns: [Contracts.uuid],
    }),
    foreignKey({
      name: "fk_quotes_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_quotes_billing_address",
      columns: [table.billingAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectQuotes = InferSelectModel<typeof Quotes>;
export type InsertQuotes = InferInsertModel<typeof Quotes>;
