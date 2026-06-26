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
  purchaseInvoiceBlockReasons,
  purchaseInvoiceFiscalBases,
} from "../../lib/enums";
import { Companies } from "./companies";
import { Contacts } from "./contacts";

export const PurchaseInvoices = mysqlTable(
  "PurchaseInvoices",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),
    invoiceSentByContactUuid: char("invoice_sent_by_contact_uuid", {
      length: 36,
    }),

    bookingDate: date("booking_date"),
    invoiceDate: date("invoice_date"),
    expirationDate: date("expiration_date"),

    invoiceNumberSupplier: varchar("invoice_number_supplier", { length: 100 }),
    creditorNo: varchar("creditor_no", { length: 100 }),
    creditorNo2: varchar("creditor_no_2", { length: 100 }),

    basisForFiscalPeriod: mysqlEnum(
      "basis_for_fiscal_period",
      purchaseInvoiceFiscalBases,
    )
      .default("booking_date")
      .notNull(),

    invoiceTotal: decimal("invoice_total", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    purchaseOrderNumber: varchar("purchase_order_number", { length: 100 }),

    paymentTerms: mysqlEnum("pi_payment_terms", invoicePaymentTerms),
    blocked: boolean("blocked").default(false).notNull(),
    blockReason: mysqlEnum("block_reason", purchaseInvoiceBlockReasons),

    materials: decimal("materials", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    optionsAmount: decimal("options_amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    surcharges: decimal("surcharges", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    vatHigh: decimal("vat_high", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    vatMiddle: decimal("vat_middle", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    vatLow: decimal("vat_low", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    creditRestriction: decimal("credit_restriction", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    remarks: text("remarks"),
    documents: json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_invoices_company_uuid").on(table.companyUuid),
    index("idx_purchase_invoices_contact_uuid").on(
      table.invoiceSentByContactUuid,
    ),
    foreignKey({
      name: "fk_purchase_invoices_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_invoices_contact",
      columns: [table.invoiceSentByContactUuid],
      foreignColumns: [Contacts.uuid],
    }),
  ],
);

export type SelectPurchaseInvoices = InferSelectModel<typeof PurchaseInvoices>;
export type InsertPurchaseInvoices = InferInsertModel<typeof PurchaseInvoices>;
