import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { bankAccountTypes } from "../../lib/enums";
import { Companies } from "./companies";

export const CompanyBankAccounts = mysqlTable(
  "company_bank_accounts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    accountType: mysqlEnum("account_type", bankAccountTypes).default("main"),

    accountHolderName: varchar("account_holder_name", { length: 255 }),
    bankName: varchar("bank_name", { length: 255 }),

    iban: varchar("iban", { length: 100 }).notNull(),
    swiftBic: varchar("swift_bic", { length: 100 }),

    bankCountry: varchar("bank_country", { length: 100 }),
    bankCity: varchar("bank_city", { length: 150 }),
    bankAddress: varchar("bank_address", { length: 255 }),

    currencyCode: varchar("currency_code", { length: 10 }).default("EUR"),

    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_bank_accounts_company_uuid").on(table.companyUuid),
    index("idx_company_bank_accounts_iban").on(table.iban),
    foreignKey({
      name: "fk_company_bank_accounts_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);
