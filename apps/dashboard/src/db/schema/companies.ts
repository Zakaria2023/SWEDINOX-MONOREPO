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
import { companyLangs, currencies, invoicePaymentTerms, type CompanyRole } from "../../lib/enums";

export const Companies = mysqlTable(
  "Companies",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    correspName: varchar("corresp_name", { length: 255 }),
    lang: mysqlEnum("lang", companyLangs),
    remarks: text("remarks"),
    searchCode1: varchar("search_code_1", { length: 100 }),
    searchCode2: varchar("search_code_2", { length: 100 }),
    searchCode3: varchar("search_code_3", { length: 100 }),
    roles: json("roles").$type<CompanyRole[]>().default([]).notNull(),
    documents: json("documents").$type<Array<{ id: string; fileName: string }>>(),

    // Debtor fields
    debtorCompanyUuid: char("debtor_company_uuid", { length: 36 }),
    iban: varchar("iban", { length: 34 }),
    bic: varchar("bic", { length: 11 }),
    bankAccount: varchar("bank_account", { length: 50 }),
    postbankAccount: varchar("postbank_account", { length: 50 }),
    purchaseOrgCompanyUuid: char("purchase_org_company_uuid", { length: 36 }),
    memberNumberPurchaseOrg: varchar("member_number_purchase_org", { length: 100 }),
    calculateVat: boolean("calculate_vat").notNull().default(true),
    reminder: boolean("reminder").notNull().default(true),
    collectInvoicesInMandate: boolean("collect_invoices_in_mandate").notNull().default(false),
    insuranceValidUntil: date("insurance_valid_until"),
    creditLimitInsurance: decimal("credit_limit_insurance", { precision: 15, scale: 2 }),
    creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
    creditLimitUninsured: decimal("credit_limit_uninsured", { precision: 15, scale: 2 }),
    creditLimitUninsuredDate: date("credit_limit_uninsured_date"),
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),
    differentPaymentTermsExWorks: mysqlEnum("different_payment_terms_ex_works", invoicePaymentTerms),
    journalCode: int("journal_code"),
    vatNumber: varchar("vat_number", { length: 50 }),
    cocNumber: varchar("coc_number", { length: 50 }),
    currency: mysqlEnum("currency", currencies),
    blocked: boolean("blocked").notNull().default(false),
    blockedByUserId: varchar("blocked_by_user_id", { length: 255 }),
    blockedByNote: varchar("blocked_by_note", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_companies_debtor_company_uuid").on(table.debtorCompanyUuid),
    index("idx_companies_purchase_org_company_uuid").on(table.purchaseOrgCompanyUuid),
    foreignKey({
      name: "fk_companies_debtor_company",
      columns: [table.debtorCompanyUuid],
      foreignColumns: [table.uuid],
    }),
    foreignKey({
      name: "fk_companies_purchase_org_company",
      columns: [table.purchaseOrgCompanyUuid],
      foreignColumns: [table.uuid],
    }),
  ],
);

export type SelectCompanies = InferSelectModel<typeof Companies>;
export type InsertCompanies = InferInsertModel<typeof Companies>;
