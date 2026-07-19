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
  visitReportContactMethods,
  visitReportReasons,
  VisitPlanningEntry,
  VisitReportCategory,
  VisitReportReader,
} from "@/lib/enums";
import { Companies } from "./companies";
import { Contacts } from "./contacts";

export const VisitReports = mysqlTable(
  "VisitReports",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    representative: varchar("representative", { length: 255 }),
    visitedBy: varchar("visited_by", { length: 255 }),

    address: varchar("address", { length: 255 }),
    postalCode: varchar("postal_code", { length: 50 }),
    city: varchar("city", { length: 150 }),
    telephone: varchar("telephone", { length: 100 }),
    fax: varchar("fax", { length: 100 }),
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

    // ── Marketing ─────────────────────────────────────────────────────────────
    // industry stores the SBI code (Industries.id); a logical reference to the
    // Industries lookup table.
    industry: varchar("industry", { length: 10 }),
    classification: mysqlEnum("classification", companyClassifications),
    visitFrequency: int("visit_frequency").default(0),
    callFrequencyPerYear: int("call_frequency_per_year").default(0),
    targetDateNextVisit: date("target_date_next_visit"),
    nextVisitReason: mysqlEnum("next_visit_reason", visitReportReasons),
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

    // ── Visit planning ────────────────────────────────────────────────────────
    // Yearly grid, ordered January (index 0) → December (index 11).
    visitPlanning: json("visit_planning")
      .$type<VisitPlanningEntry[]>()
      .default([]),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_visit_reports_company_uuid").on(table.companyUuid),
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
