import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  devTheorWtOptions,
  groupLinesByDescriptionOptions,
  printProductCodesOptions,
  salesRepresentatives,
  type EdiOption,
  type MiscellaneousOption,
  type OrderOption,
  type QuoteOption,
  type QuoteOrderInvoiceOption,
  type QuoteOrderOption,
} from "../../lib/enums";
import { Companies } from "./companies";
import { CustomerGroups } from "./customer-groups";

export const CustomerSales = mysqlTable(
  "CustomerSales",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),

    // Commercial layout
    customerGroupUuid: char("customer_group_uuid", { length: 36 }),
    representative: mysqlEnum("representative", salesRepresentatives),
    accountManager: mysqlEnum("account_manager", salesRepresentatives),
    region: varchar("region", { length: 255 }),

    // Miscellaneous
    memberOf: varchar("member_of", { length: 255 }),
    miscellaneousSettings: json("miscellaneous_settings")
      .$type<MiscellaneousOption[]>()
      .default([])
      .notNull(),

    // Quote/Order
    deliveryCondition: varchar("delivery_condition", { length: 255 }),
    devTheorWt: mysqlEnum("dev_theor_wt", devTheorWtOptions),
    defTransport: varchar("def_transport", { length: 255 }),
    quoteOrderSettings: json("quote_order_settings")
      .$type<QuoteOrderOption[]>()
      .default([])
      .notNull(),

    // Quote/Order/Invoice
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

    // Order
    orderSettings: json("order_settings")
      .$type<OrderOption[]>()
      .default([])
      .notNull(),

    // Quote
    quoteSettings: json("quote_settings")
      .$type<QuoteOption[]>()
      .default([])
      .notNull(),

    // Website-quote
    websiteQuoteMustBeApproved: boolean("website_quote_must_be_approved").default(false).notNull(),
    websiteQuoteApprovalAmount: decimal("website_quote_approval_amount", { precision: 15, scale: 2 }),

    // Actions upon release
    releaseActionPrint: boolean("release_action_print").default(false).notNull(),
    releaseActionEmailEnabled: boolean("release_action_email_enabled").default(false).notNull(),
    releaseActionEmailTo: varchar("release_action_email_to", { length: 255 }),
    releaseActionFaxEnabled: boolean("release_action_fax_enabled").default(false).notNull(),
    releaseActionFaxTo: varchar("release_action_fax_to", { length: 255 }),

    // Actions upon (quote/order confirmation)
    actionPrint: boolean("action_print").default(false).notNull(),
    actionEmailEnabled: boolean("action_email_enabled").default(false).notNull(),
    actionEmailTo: varchar("action_email_to", { length: 255 }),
    actionFaxEnabled: boolean("action_fax_enabled").default(false).notNull(),
    actionFaxTo: varchar("action_fax_to", { length: 255 }),

    // EDI
    ediSettings: json("edi_settings")
      .$type<EdiOption[]>()
      .default([])
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_customer_sales_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_customer_sales_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_customer_sales_customer_group",
      columns: [table.customerGroupUuid],
      foreignColumns: [CustomerGroups.uuid],
    }),
  ],
);

export type SelectCustomerSales = InferSelectModel<typeof CustomerSales>;
export type InsertCustomerSales = InferInsertModel<typeof CustomerSales>;
