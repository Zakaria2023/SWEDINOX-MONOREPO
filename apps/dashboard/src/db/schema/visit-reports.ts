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
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  visitReportContactMethods,
  visitReportReasons,
  VisitReportCategory,
  VisitReportReader,
} from "@/lib/enums";
import { Companies } from "./companies";
import { Contacts } from "./contacts";

// One visit or call: who went, when, why, whom they saw and what was said.
//
// Nothing about the *company* is stored here. The reference's `VISITREPORT`
// holds no address, phone, industry, classification, frequency, target or
// planning — those live on the company (`COMPANY_ADDRESS`, `COMPANY_MARKETING`,
// `COMPANY_VISITPLANNING`) and a report reads them. Copies used to be kept on
// each report and drifted from the company's; they were dropped on 15-9-2026
// (scripts/migrate-remaining-2026-09-15.mjs, backup in scripts/backups/).
export const VisitReports = mysqlTable(
  "VisitReports",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    representative: varchar("representative", { length: 255 }),
    visitedBy: varchar("visited_by", { length: 255 }),
    contactUuid: char("contact_uuid", { length: 36 }),

    contactMethod: mysqlEnum("contact_method", visitReportContactMethods),
    visitDate: varchar("visit_date", { length: 10 }),
    visitTime: varchar("visit_time", { length: 8 }),
    hasTakenPlace: boolean("has_taken_place").default(false).notNull(),

    visitReason: mysqlEnum("visit_reason", visitReportReasons),
    attentionPoint: text("attention_point"),
    remarks: text("remarks"),

    // ── Categories ────────────────────────────────────────────────────────────
    categories: json("categories").$type<VisitReportCategory[]>().default([]),

    // ── Readers ───────────────────────────────────────────────────────────────
    readers: json("readers").$type<VisitReportReader[]>().default([]),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_visit_reports_company_uuid").on(table.companyUuid),
    // /visits-made and the visit schedule both read by date.
    index("idx_visit_reports_visit_date").on(table.visitDate),
    index("idx_visit_reports_created_at_id").on(table.createdAt, table.id),
    foreignKey({
      name: "fk_visit_reports_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_visit_reports_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
  ],
);

export type SelectVisitReports = InferSelectModel<typeof VisitReports>;
export type InsertVisitReports = InferInsertModel<typeof VisitReports>;
