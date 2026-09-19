import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { Companies } from "./companies";

// One company's contact plan for one month: are we ringing them, are we going
// to see them.
//
// This is the reference's `Call` and `Visit` tick boxes, which had no table
// here at all. `Change visit schedule` is where they are set and `Visit
// schedule` reads them back for the month it is showing — the same two values,
// two screens.
//
// A plan is not a due date. The due dates this app computes say when a
// relationship has gone quiet for longer than the customer's frequency allows;
// a plan says what a person decided to do about it. Nothing derives one from
// the other, and a month with no row is simply a month nobody planned.
//
// ⚠️ Nobody ever ticked one in the reference: `Call` and `Visit` are `False` on
// all 2 531 of its rows and both "upcoming month" columns are empty on all
// 2 531. The feature exists and has never been used. See
// `docs/reference-system/customers-and-prospects.md` §40–42.
export const VisitPlans = mysqlTable(
  "VisitPlans",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    // The month the plan is for, kept as two numbers rather than a date: a plan
    // belongs to September, not to any day in it, and the reference's screen
    // selects a month with no day at all.
    planYear: int("plan_year").notNull(),
    planMonth: int("plan_month").notNull(),

    call: boolean("call").default(false).notNull(),
    visit: boolean("visit").default(false).notNull(),

    plannedByUserId: varchar("planned_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    // One plan per company per month, so ticking a box twice updates rather
    // than duplicates.
    uniqueIndex("idx_visit_plans_company_period").on(
      table.companyUuid,
      table.planYear,
      table.planMonth,
    ),
    // The schedule reads a whole month at a time.
    index("idx_visit_plans_period").on(table.planYear, table.planMonth),
    foreignKey({
      name: "fk_visit_plans_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectVisitPlans = InferSelectModel<typeof VisitPlans>;
export type InsertVisitPlans = InferInsertModel<typeof VisitPlans>;
