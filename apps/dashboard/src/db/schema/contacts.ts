import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { contactSalutations } from "../../lib/enums";
import { CompanyAddresses } from "./company-addresses";
import { Locations } from "./locations";

export const ContactCategories = mysqlTable("contact_categories", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const Contacts = mysqlTable(
  "contacts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    salutation: mysqlEnum("salutation", contactSalutations),

    title: varchar("title", { length: 100 }),
    name: varchar("name", { length: 255 }),
    initials: varchar("initials", { length: 50 }),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    fullName: varchar("full_name", { length: 255 }).notNull(),

    telephone: varchar("telephone", { length: 100 }),
    mobile: varchar("mobile", { length: 100 }),
    fax: varchar("fax", { length: 100 }),
    email: varchar("email", { length: 255 }),

    btwNumber: varchar("btw_number", { length: 100 }),
    categoryAddition: text("category_addition"),

    // Uses the existing address UUID relation in this repo.
    addressUuid: char("address_uuid", { length: 36 }),
    locationUuid: char("location_uuid", { length: 36 }),

    country: varchar("country", { length: 255 }),
    city: varchar("city", { length: 255 }),

    postalCode: varchar("postal_code", { length: 100 }),
    region: varchar("region", { length: 255 }),

    streetAndNumber: varchar("street_and_number", { length: 255 }),
    house: varchar("house", { length: 100 }),
    poBox: varchar("po_box", { length: 100 }),
    annex: varchar("annex", { length: 255 }),
    alternativeName: varchar("alternative_name", { length: 255 }),

    website: varchar("website", { length: 255 }),
    sequenceNumber: int("sequence_number"),

    isActive: boolean("is_active").default(true),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contacts_address_uuid").on(table.addressUuid),
    index("idx_contacts_location_uuid").on(table.locationUuid),
    foreignKey({
      name: "fk_contacts_address",
      columns: [table.addressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_contacts_location",
      columns: [table.locationUuid],
      foreignColumns: [Locations.uuid],
    }),
  ],
);

export const ContactCategoryLinks = mysqlTable(
  "contact_category_links",
  {
    id: int("id").primaryKey().autoincrement(),

    contactUuid: char("contact_uuid", { length: 36 }).notNull(),
    contactCategoryUuid: char("contact_category_uuid", { length: 36 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contact_category_links_contact_uuid").on(table.contactUuid),
    index("idx_contact_category_links_category_uuid").on(
      table.contactCategoryUuid,
    ),
    foreignKey({
      name: "fk_contact_category_links_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_contact_category_links_category",
      columns: [table.contactCategoryUuid],
      foreignColumns: [ContactCategories.uuid],
    }),
  ],
);
