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
  companyClassifications,
  companyLangs,
  currencies,
  customerGroups,
  devTheorWtOptions,
  groupLinesByDescriptionOptions,
  invoiceFrequencies,
  invoicePaymentTerms,
  invoicingMethods,
  printProductCodesOptions,
  salesRepresentatives,
  visitReportReasons,
  CompanyRole,
  EdiOption,
  MiscellaneousOption,
  OrderOption,
  QuoteOption,
  QuoteOrderInvoiceOption,
  QuoteOrderOption,
  VisitPlanningEntry,
} from "../../lib/enums";

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
    roles: json("roles").$type<CompanyRole[]>().default([]),
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    // Sales settings
    customerGroup: mysqlEnum("customer_group", customerGroups),
    representative: mysqlEnum("representative", salesRepresentatives),
    accountManager: mysqlEnum("account_manager", salesRepresentatives),
    region: varchar("region", { length: 255 }),
    memberOf: varchar("member_of", { length: 255 }),
    miscellaneousSettings: json("miscellaneous_settings")
      .$type<MiscellaneousOption[]>()
      .default([]),
    deliveryCondition: varchar("delivery_condition", { length: 255 }),
    devTheorWt: mysqlEnum("dev_theor_wt", devTheorWtOptions),
    defTransport: varchar("def_transport", { length: 255 }),
    quoteOrderSettings: json("quote_order_settings")
      .$type<QuoteOrderOption[]>()
      .default([]),
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
      .default([]),
    orderSettings: json("order_settings").$type<OrderOption[]>().default([]),
    quoteSettings: json("quote_settings").$type<QuoteOption[]>().default([]),
    websiteQuoteMustBeApproved: boolean(
      "website_quote_must_be_approved",
    ).default(false),
    websiteQuoteApprovalAmount: decimal("website_quote_approval_amount", {
      precision: 15,
      scale: 2,
    }),
    releaseActionPrint: boolean("release_action_print").default(false),
    releaseActionEmailEnabled: boolean("release_action_email_enabled").default(
      false,
    ),
    releaseActionEmailTo: varchar("release_action_email_to", { length: 255 }),
    releaseActionFaxEnabled: boolean("release_action_fax_enabled").default(
      false,
    ),
    releaseActionFaxTo: varchar("release_action_fax_to", { length: 255 }),
    actionPrint: boolean("action_print").default(false),
    actionEmailEnabled: boolean("action_email_enabled").default(false),
    actionEmailTo: varchar("action_email_to", { length: 255 }),
    actionFaxEnabled: boolean("action_fax_enabled").default(false),
    actionFaxTo: varchar("action_fax_to", { length: 255 }),
    ediSettings: json("edi_settings").$type<EdiOption[]>().default([]),

    // Marketing settings
    // industry stores the SBI code (Industries.id); it's a logical reference
    // to the Industries lookup table.
    industry: varchar("industry", { length: 10 }),
    classification: mysqlEnum("classification", companyClassifications),
    visitFrequency: int("visit_frequency").default(0),
    callFrequencyPerYear: int("call_frequency_per_year").default(0),
    targetDateNextVisit: date("target_date_next_visit"),
    visitReason: mysqlEnum("visit_reason", visitReportReasons),
    potentialAnnualRevenue: decimal("potential_annual_revenue", {
      precision: 15,
      scale: 2,
    }),
    targetAnnualRevenue: decimal("target_annual_revenue", {
      precision: 15,
      scale: 2,
    }),
    potentialAnnualSales: decimal("potential_annual_sales", {
      precision: 15,
      scale: 3,
    }),
    targetAnnualSales: decimal("target_annual_sales", {
      precision: 15,
      scale: 3,
    }),
    numberOfEmployees: int("number_of_employees").default(0),
    visitPlanning: json("visit_planning")
      .$type<VisitPlanningEntry[]>()
      .default([]),

    // Debtor fields
    debtorCompanyUuid: char("debtor_company_uuid", { length: 36 }),
    iban: varchar("iban", { length: 34 }),
    bic: varchar("bic", { length: 11 }),
    bankAccount: varchar("bank_account", { length: 50 }),
    postbankAccount: varchar("postbank_account", { length: 50 }),
    purchaseOrgCompanyUuid: char("purchase_org_company_uuid", { length: 36 }),
    memberNumberPurchaseOrg: varchar("member_number_purchase_org", {
      length: 100,
    }),
    calculateVat: boolean("calculate_vat").default(true),
    reminder: boolean("reminder").default(true),
    collectInvoicesInMandate: boolean("collect_invoices_in_mandate").default(
      false,
    ),
    insuranceValidUntil: date("insurance_valid_until"),
    creditLimitInsurance: decimal("credit_limit_insurance", {
      precision: 15,
      scale: 2,
    }),
    creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
    creditLimitUninsured: decimal("credit_limit_uninsured", {
      precision: 15,
      scale: 2,
    }),
    creditLimitUninsuredDate: date("credit_limit_uninsured_date"),
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),
    differentPaymentTermsExWorks: mysqlEnum(
      "different_payment_terms_ex_works",
      invoicePaymentTerms,
    ),
    journalCode: int("journal_code"),
    vatNumber: varchar("vat_number", { length: 50 }),
    cocNumber: varchar("coc_number", { length: 50 }),
    currency: mysqlEnum("currency", currencies),
    blockedByUserId: varchar("blocked_by_user_id", { length: 255 }),
    blockedByNote: varchar("blocked_by_note", { length: 500 }),
    // Manually flagged as inactive — surfaces the company on the Inactive
    // Companies overview regardless of its order history.
    isInactive: boolean("is_inactive").default(false),

    // Invoicing settings (customer)
    invoicingMethod: mysqlEnum("invoicing_method", invoicingMethods),
    collectiveInvoicing: boolean("collective_invoicing").default(false),
    invoicePackagingAtZeroPrice: boolean(
      "invoice_packaging_at_zero_price",
    ).default(false),
    printCommodityCode: boolean("print_commodity_code").default(false),
    invoiceFrequency: mysqlEnum(
      "invoice_frequency",
      invoiceFrequencies,
    ).default("daily"),
    invoicePrintEnabled: boolean("invoice_print_enabled").default(false),
    invoicePrintCount: int("invoice_print_count").default(1),
    invoiceEmailEnabled: boolean("invoice_email_enabled").default(false),
    invoiceEmailTo: varchar("invoice_email_to", { length: 255 }),
    printEmailZeroValueInvoices: boolean(
      "print_email_zero_value_invoices",
    ).default(false),
    sendXmlWithInvoice: boolean("send_xml_with_invoice").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_companies_industry").on(table.industry),
    index("idx_companies_debtor_company_uuid").on(table.debtorCompanyUuid),
    index("idx_companies_purchase_org_company_uuid").on(
      table.purchaseOrgCompanyUuid,
    ),
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
