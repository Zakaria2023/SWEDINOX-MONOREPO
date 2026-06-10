import {
  boolean,
  char,
  date,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { visitFrequencies } from "../../lib/enums";
import { CompanyAddresses } from "./company-addresses";
import { Companies } from "./companies";
import { Contacts } from "./contacts";

export const CompanyVisitSettings = mysqlTable(
  "company_visit_settings",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    visitingAddressUuid: char("visiting_address_uuid", { length: 36 }),
    primaryContactUuid: char("primary_contact_uuid", { length: 36 }),

    visitFrequency: mysqlEnum("visit_frequency", visitFrequencies).default(
      "monthly",
    ),
    customVisitFrequencyDays: int("custom_visit_frequency_days"),
    targetVisitsPerYear: int("target_visits_per_year").default(0),

    lastVisitDate: date("last_visit_date"),
    nextVisitDate: date("next_visit_date"),

    lastCallDate: date("last_call_date"),
    nextCallDate: date("next_call_date"),

    shouldVisit: boolean("should_visit").default(false),
    shouldCall: boolean("should_call").default(false),

    accountManagerUserId: varchar("account_manager_user_id", { length: 255 }),
    representativeUserId: varchar("representative_user_id", { length: 255 }),

    // TODO: Replace accountManagerUserId and representativeUserId
    // with foreign keys when the app has a local users/sales representatives table.
    visitInstructions: text("visit_instructions"),
    notes: text("notes"),

    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_visit_settings_company_uuid").on(table.companyUuid),
    index("idx_company_visit_settings_visiting_address_uuid").on(
      table.visitingAddressUuid,
    ),
    index("idx_company_visit_settings_primary_contact_uuid").on(
      table.primaryContactUuid,
    ),
    foreignKey({
      name: "fk_company_visit_settings_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_company_visit_settings_address",
      columns: [table.visitingAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_company_visit_settings_contact",
      columns: [table.primaryContactUuid],
      foreignColumns: [Contacts.uuid],
    }),
  ],
);
