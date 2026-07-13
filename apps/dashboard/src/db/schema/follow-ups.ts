import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { Companies } from "./companies";

// Company-scoped follow-ups (customer follow-up log). `date` and `by` are
// auto-filled when the row is created; `contactPerson` and `text` are free
// text entered by the user.
export const FollowUps = mysqlTable(
  "FollowUps",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    date: varchar("follow_up_date", { length: 10 }),
    by: varchar("by_user", { length: 255 }),
    contactPerson: varchar("contact_person", { length: 255 }),
    text: text("text"),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_follow_ups_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_follow_ups_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectFollowUps = InferSelectModel<typeof FollowUps>;
export type InsertFollowUps = InferInsertModel<typeof FollowUps>;
