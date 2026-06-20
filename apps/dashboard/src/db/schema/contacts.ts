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
import { ContactCategory, contactSalutations } from "../../lib/enums";
import { Companies } from "./companies";

export const Contacts = mysqlTable(
  "Contacts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),

    salutation: mysqlEnum("salutation", contactSalutations),
    firstName: varchar("first_name", { length: 255 }),
    initials: varchar("initials", { length: 50 }),
    lastName: varchar("last_name", { length: 255 }),
    telephone: varchar("telephone", { length: 100 }),
    mobile: varchar("mobile", { length: 100 }),
    fax: varchar("fax", { length: 100 }),
    email: varchar("email", { length: 255 }),
    address: varchar("address", { length: 500 }),
    categoryAddition: varchar("category_addition", { length: 255 }),
    btwNumber: varchar("btw_number", { length: 100 }),

    country: varchar("country", { length: 100 }),
    postal: varchar("postal", { length: 20 }),
    house: varchar("house", { length: 50 }),
    poBox: boolean("po_box").default(false).notNull(),
    streetAndNo: varchar("street_and_no", { length: 255 }),
    annex: varchar("annex", { length: 255 }),
    postalCode: varchar("postal_code", { length: 50 }),
    city: varchar("city", { length: 150 }),
    region: varchar("region", { length: 150 }),
    addressCountry: varchar("address_country", { length: 100 }),
    addressTelephone: varchar("address_telephone", { length: 100 }),
    addressFax: varchar("address_fax", { length: 100 }),
    addressEmail: varchar("address_email", { length: 255 }),
    website: varchar("website", { length: 255 }),

    purchaser: varchar("purchaser", { length: 255 }),
    searchCode1: varchar("search_code_1", { length: 100 }),
    searchCode2: varchar("search_code_2", { length: 100 }),
    searchCode3: varchar("search_code_3", { length: 100 }),

    revenueLastYear: decimal("revenue_last_year", { precision: 15, scale: 2 }),
    revenueThisYear: decimal("revenue_this_year", { precision: 15, scale: 2 }),

    accountManager: varchar("account_manager", { length: 255 }),
    representative: varchar("representative", { length: 255 }),
    customerGroup: varchar("customer_group", { length: 255 }),
    industryCode: varchar("industry_code", { length: 100 }),
    industry: varchar("industry", { length: 255 }),
    classificationCode: varchar("classification_code", { length: 100 }),
    classification: varchar("classification", { length: 255 }),
    creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
    competitors: varchar("competitors", { length: 500 }),
    customerRegionCode: varchar("customer_region_code", { length: 100 }),
    customerRegion: varchar("customer_region", { length: 255 }),
    targetYearRevenue: decimal("target_year_revenue", {
      precision: 15,
      scale: 2,
    }),
    targetAnnualSales: decimal("target_annual_sales", {
      precision: 15,
      scale: 2,
    }),

    isCustomer: boolean("is_customer").default(false).notNull(),
    isProspect: boolean("is_prospect").default(false).notNull(),
    isSupplier: boolean("is_supplier").default(false).notNull(),
    isProcessor: boolean("is_processor").default(false).notNull(),
    isTransporter: boolean("is_transporter").default(false).notNull(),
    isAgent: boolean("is_agent").default(false).notNull(),
    isOther: boolean("is_other").default(false).notNull(),

    visitStreetAndNo: varchar("visit_street_and_no", { length: 255 }),
    visitPostalCode: varchar("visit_postal_code", { length: 50 }),
    visitCity: varchar("visit_city", { length: 150 }),
    visitCountry: varchar("visit_country", { length: 100 }),
    visitTelephone: varchar("visit_telephone", { length: 100 }),
    visitFax: varchar("visit_fax", { length: 100 }),

    categories: json("categories")
      .$type<ContactCategory[]>()
      .default([])
      .notNull(),
    sequenceNumber: int("sequence_number").default(1).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contacts_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_contacts_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectContacts = InferSelectModel<typeof Contacts>;
export type InsertContacts = InferInsertModel<typeof Contacts>;
