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

// General-ledger journal entries. A sales/purchase invoice posts to several
// of these rows (revenue/purchases, debtor/creditor, VAT); this table is the
// authoritative accounting ledger behind the Finance overviews.
export const JournalEntries = mysqlTable(
  "JournalEntries",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

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
    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
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

    // Source links.
    companyUuid: char("company_uuid", { length: 36 }),
    invoiceUuid: char("invoice_uuid", { length: 36 }),
    createdByUserId: varchar("created_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_journal_entries_booking_date").on(table.bookingDate),
    index("idx_journal_entries_company_uuid").on(table.companyUuid),
    index("idx_journal_entries_invoice_uuid").on(table.invoiceUuid),
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
  ],
);

export type SelectJournalEntries = InferSelectModel<typeof JournalEntries>;
export type InsertJournalEntries = InferInsertModel<typeof JournalEntries>;
