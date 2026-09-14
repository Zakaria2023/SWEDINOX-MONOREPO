import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
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

// A contact person: the person's own name, phones, email, postal details,
// categories and sequence. Everything about the *company* — its roles, visiting
// address, representative, customer group, credit limit, revenue — lives on
// `Companies` / `CompanyAddresses` and is joined in. The reference proves it:
// every contact of a company prints the same company values (2 188 of 2 188).
// Those used to be copied onto each contact and drifted; they were dropped on
// 14-9-2026 (scripts/migrate-contacts-drop-company-copies.mjs).
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
