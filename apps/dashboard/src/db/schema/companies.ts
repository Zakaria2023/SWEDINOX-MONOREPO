import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  companyLangs,
  customerGroups,
  devTheorWtOptions,
  groupLinesByDescriptionOptions,
  printProductCodesOptions,
  salesRepresentatives,
  type CompanyRole,
  type EdiOption,
  type MiscellaneousOption,
  type OrderOption,
  type QuoteOption,
  type QuoteOrderInvoiceOption,
  type QuoteOrderOption,
} from "../../lib/enums";

export const Companies = mysqlTable("Companies", {
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

  // Sales settings
  customerGroup: mysqlEnum("customer_group", customerGroups),
  representative: mysqlEnum("representative", salesRepresentatives),
  accountManager: mysqlEnum("account_manager", salesRepresentatives),
  region: varchar("region", { length: 255 }),
  memberOf: varchar("member_of", { length: 255 }),
  miscellaneousSettings: json("miscellaneous_settings")
    .$type<MiscellaneousOption[]>()
    .default([])
    .notNull(),
  deliveryCondition: varchar("delivery_condition", { length: 255 }),
  devTheorWt: mysqlEnum("dev_theor_wt", devTheorWtOptions),
  defTransport: varchar("def_transport", { length: 255 }),
  quoteOrderSettings: json("quote_order_settings")
    .$type<QuoteOrderOption[]>()
    .default([])
    .notNull(),
  groupLinesByLongProductGroupDescription: mysqlEnum(
    "group_lines_by_long_product_group_description",
    groupLinesByDescriptionOptions,
  ),
  printProductCodesOnOutgoingDocuments: mysqlEnum(
    "print_product_codes_on_outgoing_documents",
    printProductCodesOptions,
  ),
  quoteOrderInvoiceSettings: json("quote_order_invoice_settings")
    .$type<QuoteOrderInvoiceOption[]>()
    .default([])
    .notNull(),
  orderSettings: json("order_settings").$type<OrderOption[]>().default([]).notNull(),
  quoteSettings: json("quote_settings").$type<QuoteOption[]>().default([]).notNull(),
  websiteQuoteMustBeApproved: boolean("website_quote_must_be_approved").default(false).notNull(),
  websiteQuoteApprovalAmount: decimal("website_quote_approval_amount", { precision: 15, scale: 2 }),
  releaseActionPrint: boolean("release_action_print").default(false).notNull(),
  releaseActionEmailEnabled: boolean("release_action_email_enabled").default(false).notNull(),
  releaseActionEmailTo: varchar("release_action_email_to", { length: 255 }),
  releaseActionFaxEnabled: boolean("release_action_fax_enabled").default(false).notNull(),
  releaseActionFaxTo: varchar("release_action_fax_to", { length: 255 }),
  actionPrint: boolean("action_print").default(false).notNull(),
  actionEmailEnabled: boolean("action_email_enabled").default(false).notNull(),
  actionEmailTo: varchar("action_email_to", { length: 255 }),
  actionFaxEnabled: boolean("action_fax_enabled").default(false).notNull(),
  actionFaxTo: varchar("action_fax_to", { length: 255 }),
  ediSettings: json("edi_settings").$type<EdiOption[]>().default([]).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectCompanies = InferSelectModel<typeof Companies>;
export type InsertCompanies = InferInsertModel<typeof Companies>;
