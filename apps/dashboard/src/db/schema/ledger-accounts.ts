import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { ledgerAccountTypes } from "../../lib/enums";

// The chart of accounts — what each general-ledger account number means.
//
// JournalEntries.account has always held a number, but nothing said what "8000"
// was, so the numbers were only as meaningful as the constant that wrote them.
// This is the authority for that: a name, and a type that decides which side of
// the account increases it and which statement it belongs on.
//
// Postings reference an account by its number rather than by a foreign key, on
// purpose. A missing chart row must not be able to stop an invoice being
// booked — an unnamed account is a gap in the reference data, not a reason to
// lose the accounting.
export const LedgerAccounts = mysqlTable(
  "LedgerAccounts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    number: varchar("number", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum("type", ledgerAccountTypes).notNull(),
    // A sub-ledger account is settled per debtor or creditor rather than as one
    // balance, so the overviews break it down by company.
    isSubLedger: boolean("is_sub_ledger").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [unique("uq_ledger_accounts_number").on(table.number)],
);

export type SelectLedgerAccounts = InferSelectModel<typeof LedgerAccounts>;
export type InsertLedgerAccounts = InferInsertModel<typeof LedgerAccounts>;
