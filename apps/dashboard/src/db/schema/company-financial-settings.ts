import {
  boolean,
  char,
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
  invoiceDeliveryMethods,
  paymentTermTypes,
} from "../../lib/enums";
import { CompanyAddresses } from "./company-addresses";
import { Companies } from "./companies";

export const CompanyFinancialSettings = mysqlTable(
  "company_financial_settings",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    billingAddressUuid: char("billing_address_uuid", { length: 36 }),

    creditorNumber: varchar("creditor_number", { length: 100 }),
    debtorNumber: varchar("debtor_number", { length: 100 }),

    vatNumber: varchar("vat_number", { length: 100 }),
    chamberOfCommerceNo: varchar("chamber_of_commerce_no", { length: 100 }),

    paymentTerm: mysqlEnum("payment_term", paymentTermTypes).default("net_30"),
    customPaymentTerm: varchar("custom_payment_term", { length: 255 }),

    iban: varchar("iban", { length: 100 }),
    bankName: varchar("bank_name", { length: 255 }),
    bankCountry: varchar("bank_country", { length: 100 }),
    swiftBic: varchar("swift_bic", { length: 100 }),

    creditLimit: decimal("credit_limit", {
      precision: 18,
      scale: 3,
    }).default("0"),
    creditRestriction: varchar("credit_restriction", { length: 255 }),

    invoiceDeliveryMethod: mysqlEnum(
      "invoice_delivery_method",
      invoiceDeliveryMethods,
    ).default("email"),
    invoiceEmail: varchar("invoice_email", { length: 255 }),

    isInvoiceBlocked: boolean("is_invoice_blocked").default(false),
    invoiceBlockedReason: varchar("invoice_blocked_reason", { length: 255 }),

    isActive: boolean("is_active").default(true),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_financial_settings_company_uuid").on(table.companyUuid),
    index("idx_company_financial_settings_billing_address_uuid").on(
      table.billingAddressUuid,
    ),
    foreignKey({
      name: "fk_company_financial_settings_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_company_financial_settings_billing_address",
      columns: [table.billingAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);
