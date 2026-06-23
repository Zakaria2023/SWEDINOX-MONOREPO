import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { type TextUsageCategory } from "../../lib/enums";

export const TextCategories = mysqlTable(
  "TextCategories",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    parentUuid: char("parent_uuid", { length: 36 }),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    usageCategoriesJson: json("usage_categories_json")
      .$type<TextUsageCategory[]>()
      .default([])
      .notNull(),
    sequenceNumber: int("sequence_number").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_text_categories_parent_uuid").on(table.parentUuid)],
);

export type SelectTextCategories = InferSelectModel<typeof TextCategories>;
export type InsertTextCategories = InferInsertModel<typeof TextCategories>;
