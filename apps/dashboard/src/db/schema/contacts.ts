import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { contactTypes } from "../../lib/enums";

export const ContactGroups = mysqlTable("contact_groups", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),

  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const Contacts = mysqlTable(
  "contacts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    contactType: mysqlEnum("contact_type", contactTypes),

    description: varchar("description", { length: 255 }).notNull(),

    contactGroupUuid: char("contact_group_uuid", { length: 36 }),

    quicklyChangeOrder: varchar("quickly_change_order", { length: 100 }),
    hasPriceDate: boolean("has_price_date").default(false),
    priceDate: varchar("price_date", { length: 10 }),
    linkToNewCustomer: boolean("link_to_new_customer").default(false),

    searchCode1: varchar("search_code_1", { length: 100 }),
    searchCode2: varchar("search_code_2", { length: 100 }),
    searchCode3: varchar("search_code_3", { length: 100 }),

    websiteSorting: int("website_sorting").default(10),
    hideOnWebsite: boolean("hide_on_website").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contacts_contact_group_uuid").on(table.contactGroupUuid),
    foreignKey({
      name: "fk_contacts_contact_group",
      columns: [table.contactGroupUuid],
      foreignColumns: [ContactGroups.uuid],
    }),
  ],
);

export type SelectContactGroups = InferSelectModel<typeof ContactGroups>;
export type InsertContactGroups = InferInsertModel<typeof ContactGroups>;
export type SelectContacts = InferSelectModel<typeof Contacts>;
export type InsertContacts = InferInsertModel<typeof Contacts>;
