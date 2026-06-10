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

import { contactSalutations, type CompanyContactCategory } from "../../lib/enums";
import { Companies } from "./companies";

export const CompanyContacts = mysqlTable(
  "company_contacts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    salutation: mysqlEnum("salutation", contactSalutations),
    firstName: varchar("first_name", { length: 255 }),
    initials: varchar("initials", { length: 50 }),
    lastName: varchar("last_name", { length: 255 }),
    fullName: varchar("full_name", { length: 255 }).notNull(),

    telephone: varchar("telephone", { length: 100 }),
    mobile: varchar("mobile", { length: 100 }),
    fax: varchar("fax", { length: 100 }),
    email: varchar("email", { length: 255 }),

    categoryAddition: varchar("category_addition", { length: 255 }),
    btwNumber: varchar("btw_number", { length: 100 }),

    streetAndNumber: varchar("street_and_number", { length: 255 }),
    annex: varchar("annex", { length: 255 }),
    postalCode: varchar("postal_code", { length: 100 }),
    city: varchar("city", { length: 255 }),
    region: varchar("region", { length: 255 }),
    country: varchar("country", { length: 100 }),
    house: varchar("house", { length: 100 }),
    poBox: boolean("po_box").default(false),
    website: varchar("website", { length: 255 }),

    categories: json("categories").$type<CompanyContactCategory[]>().default([]),

    sequenceNumber: int("sequence_number"),
    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_contacts_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_company_contacts_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectCompanyContacts = InferSelectModel<typeof CompanyContacts>;
export type InsertCompanyContacts = InferInsertModel<typeof CompanyContacts>;
