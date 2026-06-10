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
import {
  companyTaskPriorities,
  companyTaskStatuses,
  companyTaskTypes,
} from "../../lib/enums";
import { CompanyAddresses } from "./company-addresses";
import { Companies } from "./companies";
import { Contacts } from "./contacts";
import { CompanyVisitReports } from "./company-visit-reports";

export const CompanyTasks = mysqlTable(
  "company_tasks",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    contactUuid: char("contact_uuid", { length: 36 }),
    addressUuid: char("address_uuid", { length: 36 }),

    relatedVisitReportUuid: char("related_visit_report_uuid", {
      length: 36,
    }),

    taskType: mysqlEnum("task_type", companyTaskTypes).default("follow_up"),
    status: mysqlEnum("status", companyTaskStatuses).default("open"),
    priority: mysqlEnum("priority", companyTaskPriorities).default("normal"),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    dueDate: date("due_date"),
    completedAt: timestamp("completed_at"),

    // Stores the Clerk user ID for now.
    // TODO: Replace with a local users table relation later.
    assignedToUserId: varchar("assigned_to_user_id", { length: 255 }),
    createdByUserId: varchar("created_by_user_id", { length: 255 }).notNull(),

    isActive: boolean("is_active").default(true),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_tasks_company_uuid").on(table.companyUuid),
    index("idx_company_tasks_contact_uuid").on(table.contactUuid),
    index("idx_company_tasks_address_uuid").on(table.addressUuid),
    index("idx_company_tasks_visit_report_uuid").on(
      table.relatedVisitReportUuid,
    ),
    index("idx_company_tasks_status").on(table.status),
    index("idx_company_tasks_priority").on(table.priority),
    index("idx_company_tasks_due_date").on(table.dueDate),
    foreignKey({
      name: "fk_company_tasks_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_company_tasks_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_company_tasks_address",
      columns: [table.addressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_company_tasks_visit_report",
      columns: [table.relatedVisitReportUuid],
      foreignColumns: [CompanyVisitReports.uuid],
    }),
  ],
);
