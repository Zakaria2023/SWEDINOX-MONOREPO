import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  foreignKey,
  index,
  int,
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
    occasionalCustomer: boolean("occasional_customer").default(false).notNull(),
    memberOf: varchar("member_of", { length: 255 }),
    customerHasLoginCode: boolean("customer_has_login_code").default(false).notNull(),
    billOfLadingsPerOrder: boolean("bill_of_ladings_per_order").default(false).notNull(),
    vrachtbrievenAfdrukken: boolean("vrachtbrieven_afdrukken").default(false).notNull(),
    consignmentCustomer: boolean("consignment_customer").default(false).notNull(),
    neutralLabels: boolean("neutral_labels").default(false).notNull(),
    labelPerSawedPiece: boolean("label_per_sawed_piece").default(false).notNull(),

    // Quote/Order
    deliveryCondition: varchar("delivery_condition", { length: 255 }),
    devTheorWt: mysqlEnum("dev_theor_wt", devTheorWtOptions),
    defTransport: varchar("def_transport", { length: 255 }),
    referenceRequired: boolean("reference_required").default(false).notNull(),
    completeDelivery: boolean("complete_delivery").default(false).notNull(),
    roundWeightPerPieceUp: boolean("round_weight_per_piece_up").default(false).notNull(),
    certificaat: boolean("certificaat").default(false).notNull(),
    overlengte: boolean("overlengte").default(false).notNull(),
    defaultPickup: boolean("default_pickup").default(false).notNull(),

    // Quote/Order/Invoice
    doNotPrintPrices: boolean("do_not_print_prices").default(false).notNull(),
    totalAmountPerLine: boolean("total_amount_per_line").default(false).notNull(),
    condensingOptions: boolean("condensing_options").default(false).notNull(),
    includeOptionPricesInMaterialPrices: boolean("include_option_prices_in_material_prices").default(false).notNull(),
    groupLinesByLongProductGroupDescription: mysqlEnum("group_lines_by_long_product_group_description", groupLinesByDescriptionOptions),
    printProductCodesOnOutgoingDocuments: mysqlEnum("print_product_codes_on_outgoing_documents", printProductCodesOptions),

    // Order
    orderNetPricesOnly: boolean("order_net_prices_only").default(false).notNull(),
    orderScrapSurchargeSeparately: boolean("order_scrap_surcharge_separately").default(false).notNull(),
    orderNoCommercialBlocking: boolean("order_no_commercial_blocking").default(false).notNull(),
    orderNoFinancialBlockage: boolean("order_no_financial_blockage").default(false).notNull(),
    callOffQuantitiesOnCallOffConfirmation: boolean("call_off_quantities_on_call_off_confirmation").default(false).notNull(),
    backordersOnOrderConfirmation: boolean("backorders_on_order_confirmation").default(false).notNull(),

    // Quote
    quoteNetPricesOnly: boolean("quote_net_prices_only").default(false).notNull(),
    quoteScrapSurchargeSeparate: boolean("quote_scrap_surcharge_separate").default(false).notNull(),
    quoteNoCommercialBlocking: boolean("quote_no_commercial_blocking").default(false).notNull(),
    quoteNoFinancialBlockage: boolean("quote_no_financial_blockage").default(false).notNull(),
    quoteDontShowAtAll: boolean("quote_dont_show_at_all").default(false).notNull(),

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
    ediProductFeatures: boolean("edi_product_features").default(false).notNull(),
    ediSendPdf: boolean("edi_send_pdf").default(false).notNull(),

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
