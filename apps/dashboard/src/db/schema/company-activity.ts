import {
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
import {
  companyActivityEntities,
  companyActivityTypes,
} from "../../lib/enums";
import { Companies } from "./companies";

export const CompanyActivityLogs = mysqlTable(
  "company_activity_logs",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    activityType: mysqlEnum("activity_type", companyActivityTypes).notNull(),
    entityType: mysqlEnum("entity_type", companyActivityEntities).notNull(),

    // UUID of the related record.
    // Example: contact uuid, address uuid, document uuid, task uuid, visit report uuid.
    entityUuid: char("entity_uuid", { length: 36 }),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    // Optional old/new values as JSON string for now.
    // TODO: Replace with json column if you want structured audit data.
    oldValue: text("old_value"),
    newValue: text("new_value"),

    // Stores Clerk user ID for now.
    // TODO: Replace with local users table relation later.
    performedByUserId: varchar("performed_by_user_id", {
      length: 255,
    }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_company_activity_logs_company_uuid").on(table.companyUuid),
    index("idx_company_activity_logs_activity_type").on(table.activityType),
    index("idx_company_activity_logs_entity_type").on(table.entityType),
    index("idx_company_activity_logs_entity_uuid").on(table.entityUuid),
    index("idx_company_activity_logs_created_at").on(table.createdAt),
    foreignKey({
      name: "fk_company_activity_logs_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);
