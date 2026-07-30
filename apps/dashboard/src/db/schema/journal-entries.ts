import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { Companies } from "./companies";
import { Invoices } from "./invoices";
import { PurchaseInvoices } from "./purchase-invoices";

// General-ledger journal entries — one row per posting line.
//
// A document posts a balanced set of lines: a sales invoice debits the debtor
// and credits revenue, the credit restriction and the VAT it owes. The lines of
// one document share an `entryUuid`, and within that group the debits equal the
// credits. That is what makes a trial balance possible, and what makes an
// unbalanced posting detectable instead of invisible.
//
// This used to be one row per document carrying `amount` (net) and `vat` with
// the debtor as a text reference. Nothing recorded the other side, so the ledger
// could not be balanced, totalled by account, or turned into a balance sheet —
// only listed.
export const JournalEntries = mysqlTable(
  "JournalEntries",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // Groups the lines of one document into a single balanced entry.
    entryUuid: char("entry_uuid", { length: 36 }),

    bookingDate: date("booking_date", { mode: "string" }),
    documentDate: date("document_date", { mode: "string" }),
    documentNo: varchar("document_no", { length: 100 }),
    journal: varchar("journal", { length: 50 }),
    account: varchar("account", { length: 50 }),
    externalAccount: varchar("external_account", { length: 100 }),
    // Debtor/creditor sub-ledger reference (the "Deb/Creditor" column).
    debCreditor: varchar("deb_creditor", { length: 100 }),
    description: varchar("description", { length: 255 }),
    reference: varchar("reference", { length: 255 }),
    // The two sides. Exactly one of them carries a figure on any given line.
    debit: decimal("debit", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    credit: decimal("credit", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    // The line's signed effect on its account (debit less credit). Kept because
    // the journal overview and the export columns read it directly, and because
    // summing it is how an account's movement is measured.
    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    // VAT now has a posting line of its own, so this stays zero on new entries.
    // It is still read by rows booked before the ledger was double-sided.
    vat: decimal("vat", { precision: 15, scale: 2 }).default("0.00").notNull(),
    explanation: text("explanation"),

    // Financial-year / period the entry falls in.
    financialYear: int("financial_year"),
    period: int("period"),

    // Export/transmission tracking (the "Transmission date" / failure columns).
    transmissionDate: date("transmission_date", { mode: "string" }),
    transmissionFailureCause: varchar("transmission_failure_cause", {
      length: 255,
    }),

    // Source links — a row comes from either a sales or a purchase invoice.
    companyUuid: char("company_uuid", { length: 36 }),
    invoiceUuid: char("invoice_uuid", { length: 36 }),
    purchaseInvoiceUuid: char("purchase_invoice_uuid", { length: 36 }),
    createdByUserId: varchar("created_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_journal_entries_booking_date").on(table.bookingDate),
    index("idx_journal_entries_entry_uuid").on(table.entryUuid),
    index("idx_journal_entries_account").on(table.account),
    index("idx_journal_entries_company_uuid").on(table.companyUuid),
    index("idx_journal_entries_invoice_uuid").on(table.invoiceUuid),
    index("idx_journal_entries_purchase_invoice_uuid").on(
      table.purchaseInvoiceUuid,
    ),
    foreignKey({
      name: "fk_journal_entries_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_journal_entries_invoice",
      columns: [table.invoiceUuid],
      foreignColumns: [Invoices.uuid],
    }),
    foreignKey({
      name: "fk_journal_entries_purchase_invoice",
      columns: [table.purchaseInvoiceUuid],
      foreignColumns: [PurchaseInvoices.uuid],
    }),
  ],
);

export type SelectJournalEntries = InferSelectModel<typeof JournalEntries>;
export type InsertJournalEntries = InferInsertModel<typeof JournalEntries>;
