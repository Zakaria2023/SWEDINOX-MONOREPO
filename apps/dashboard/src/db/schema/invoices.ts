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
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  invoiceDocumentTypes,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  invoiceVatScenarios,
} from "../../lib/enums";
import { Companies } from "./companies";

export const Invoices = mysqlTable(
  "Invoices",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),
    debtorNo: varchar("debtor_no", { length: 100 }),

    // A credit note is this same document with its amounts negated, so it ages,
    // posts and settles through exactly the same machinery. `outstanding` goes
    // negative, which is what nets the debt down and hands the customer their
    // credit space back.
    documentType: mysqlEnum("document_type", invoiceDocumentTypes)
      .default("invoice")
      .notNull(),
    // What the credit note credits: the goods that came back, and the invoice
    // they were billed on. Both null on an ordinary invoice.
    returnOrderUuid: char("return_order_uuid", { length: 36 }),
    creditsInvoiceUuid: char("credits_invoice_uuid", { length: 36 }),

    invoiceDate: date("invoice_date"),
    expirationDate: date("expiration_date"),

    invoiceAmountExclVat: decimal("invoice_amount_excl_vat", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    invoiceAmountInclVat: decimal("invoice_amount_incl_vat", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    creditRestriction: decimal("credit_restriction", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    invoiceTotal: decimal("invoice_total", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    outstanding: decimal("outstanding", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    // ── Margin snapshot ───────────────────────────────────────────────────────
    // Rolled up from the invoice lines when the invoice is raised, in the same
    // shape the order header stores, so the two documents report their worth
    // identically and the finance overviews never have to re-aggregate lines to
    // show what a sale made.
    //
    // Held as a snapshot for the same reason the lines are: a revaluation of the
    // underlying stock must not retroactively change the margin booked against
    // an invoice that has already been sent.
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
    avgKiloPrice: decimal("avg_kilo_price", {
      precision: 15,
      scale: 4,
    }).default("0.0000"),
    totalWeightKg: decimal("total_weight_kg", {
      precision: 15,
      scale: 2,
    }).default("0.00"),

    calculateVat: boolean("calculate_vat").default(false).notNull(),
    printed: boolean("printed").default(false).notNull(),
    mailed: boolean("mailed").default(false).notNull(),
    cancelled: boolean("cancelled").default(false).notNull(),

    vatScenario: mysqlEnum("vat_scenario", invoiceVatScenarios),
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),
    explanation: text("explanation"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_invoices_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_invoices_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectInvoices = InferSelectModel<typeof Invoices>;
export type InsertInvoices = InferInsertModel<typeof Invoices>;

// TODO: Revisit this in the future, as we may want to add these fields to the Invoices table instead of having a separate table for surcharges. This is because surcharges are directly related to invoices and may not need to be stored in a separate table. However, for now, we will keep them separate for better organization and clarity.
export const InvoiceSurcharges = mysqlTable(
  "InvoiceSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    invoiceUuid: char("invoice_uuid", { length: 36 }),
    order: int("order").default(0).notNull(),
    description: mysqlEnum("description", invoiceSurchargeDescriptions),
    surcharge: decimal("surcharge", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    unit: varchar("unit", { length: 50 }),
    surchargePercentage: decimal("surcharge_percentage", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    // What the surcharge earns after what it cost to provide — freight bought
    // in, outsourced cutting. Recorded rather than assumed: a surcharge with no
    // cost captured contributes nothing to margin instead of counting as pure
    // profit. Mirrors OrderSurcharges.profit.
    profit: decimal("profit", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_invoice_surcharges_invoice_uuid").on(table.invoiceUuid),
    foreignKey({
      name: "fk_invoice_surcharges_invoice",
      columns: [table.invoiceUuid],
      foreignColumns: [Invoices.uuid],
    }),
  ],
);

export type SelectInvoiceSurcharges = InferSelectModel<
  typeof InvoiceSurcharges
>;
export type InsertInvoiceSurcharges = InferInsertModel<
  typeof InvoiceSurcharges
>;
