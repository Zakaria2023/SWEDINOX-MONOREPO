import { InferInsertModel, InferSelectModel } from "drizzle-orm";
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
import { visitReportContactMethods, visitReportReasons } from "@/lib/enums";
import { Companies } from "./companies";

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
    contact: varchar("contact", { length: 255 }),

    contactMethod: mysqlEnum("contact_method", visitReportContactMethods),
    visitDate: varchar("visit_date", { length: 10 }),
    visitTime: varchar("visit_time", { length: 8 }),
    hasTakenPlace: boolean("has_taken_place").default(false).notNull(),

    visitReason: mysqlEnum("visit_reason", visitReportReasons),
    attentionPoint: text("attention_point"),
    remarks: text("remarks"),

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
  ],
);

export type SelectVisitReports = InferSelectModel<typeof VisitReports>;
export type InsertVisitReports = InferInsertModel<typeof VisitReports>;
