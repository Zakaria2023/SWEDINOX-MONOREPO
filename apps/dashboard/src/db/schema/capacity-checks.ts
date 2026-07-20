import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { productionCapacityStatuses } from "../../lib/enums";

// Capacity checks — the Logistics "Capacity checks" overview. Each row is a
// configured capacity check (per type) with its occupied vs. maximum capacity
// for the day, the warning threshold and the alert-email timing.
export const CapacityChecks = mysqlTable(
  "CapacityChecks",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // Traffic-light "Status" (reuses the production-capacity statuses), the
    // check's name and its type.
    status: mysqlEnum("status", productionCapacityStatuses),
    checkName: varchar("check_name", { length: 255 }),
    type: varchar("type", { length: 100 }),

    // Capacity figures: occupied, the day's total, the maximum ceiling and the
    // warning threshold.
    occupiedCapacity: decimal("occupied_capacity", {
      precision: 15,
      scale: 2,
    }),
    capacity: decimal("capacity", { precision: 15, scale: 2 }),
    maximumCapacity: decimal("maximum_capacity", { precision: 15, scale: 2 }),
    warningCapacity: decimal("warning_capacity", { precision: 15, scale: 2 }),

    // The day the check applies to ("Date").
    checkDate: date("check_date").notNull(),

    // Alert timing: when the alert email goes out and when the max-warning
    // fires (times of day / thresholds recorded on the check).
    timeAlertEmail: varchar("time_alert_email", { length: 50 }),
    timeMaxWarning: varchar("time_max_warning", { length: 50 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_capacity_checks_date").on(table.checkDate)],
);

export type SelectCapacityChecks = InferSelectModel<typeof CapacityChecks>;
export type InsertCapacityChecks = InferInsertModel<typeof CapacityChecks>;
