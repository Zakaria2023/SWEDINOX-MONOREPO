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
  time,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  companyVisitResults,
  companyVisitTypes,
} from "../../lib/enums";
import { CompanyAddresses } from "./company-addresses";
import { Companies } from "./companies";
import { Contacts } from "./contacts";

export const CompanyVisitReports = mysqlTable(
  "company_visit_reports",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    contactUuid: char("contact_uuid", { length: 36 }),
    addressUuid: char("address_uuid", { length: 36 }),

    visitType: mysqlEnum("visit_type", companyVisitTypes).default("visit"),
    visitResult: mysqlEnum("visit_result", companyVisitResults).default(
      "planned",
    ),

    visitDate: date("visit_date").notNull(),
    visitTime: time("visit_time"),
    endTime: time("end_time"),

    subject: varchar("subject", { length: 255 }),
    reason: varchar("reason", { length: 255 }),

    tookPlace: boolean("took_place").default(false),

    summary: text("summary"),
    nextAction: text("next_action"),
    nextFollowUpDate: date("next_follow_up_date"),

    // Stores the Clerk user ID for now.
    // TODO: Replace with a local users table relation later.
    createdByUserId: varchar("created_by_user_id", { length: 255 }).notNull(),

    isActive: boolean("is_active").default(true),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_visit_reports_company_uuid").on(table.companyUuid),
    index("idx_company_visit_reports_contact_uuid").on(table.contactUuid),
    index("idx_company_visit_reports_address_uuid").on(table.addressUuid),
    index("idx_company_visit_reports_visit_date").on(table.visitDate),
    index("idx_company_visit_reports_visit_type").on(table.visitType),
    index("idx_company_visit_reports_visit_result").on(table.visitResult),
    foreignKey({
      name: "fk_company_visit_reports_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_company_visit_reports_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_company_visit_reports_address",
      columns: [table.addressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);
