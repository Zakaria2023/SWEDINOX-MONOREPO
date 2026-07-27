import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Time registration — the Logistics "Time registration" overview. A log of
// scan events from the shop floor: who scanned ("User" / "Extra User"), the
// scanned code, and the context/action the scan belongs to, each with its
// own reference.
export const TimeRegistrations = mysqlTable(
  "TimeRegistrations",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // When the scan happened ("Date Time").
    dateTime: timestamp("date_time").notNull(),

    // The operator(s) that scanned — shop-floor scan-login codes, not Clerk
    // dashboard users.
    user: varchar("user", { length: 255 }),
    extraUser: varchar("extra_user", { length: 255 }),

    // The scanned barcode ("Scan code").
    scanCode: varchar("scan_code", { length: 255 }),

    // What the scan relates to: the "Context" (e.g. the entity/screen) and
    // its reference, plus the "Action" performed and its reference.
    context: varchar("context", { length: 255 }),
    contextReference: varchar("context_reference", { length: 255 }),
    action: varchar("action", { length: 255 }),
    actionReference: varchar("action_reference", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_time_registrations_date_time").on(table.dateTime),
    index("idx_time_registrations_user").on(table.user),
  ],
);

export type SelectTimeRegistrations = InferSelectModel<
  typeof TimeRegistrations
>;
export type InsertTimeRegistrations = InferInsertModel<
  typeof TimeRegistrations
>;
