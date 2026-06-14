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

export const Texts = mysqlTable(
  "Texts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    textCategoryUuid: char("text_category_uuid", { length: 36 }),

    title: varchar("title", { length: 255 }).notNull(),
    textBlock: text("text_block").notNull(),
    usageCategoriesJson: json("usage_categories_json")
      .$type<TextUsageCategory[]>()
      .default([])
      .notNull(),
    sequenceNumber: int("sequence_number").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_texts_text_category_uuid").on(table.textCategoryUuid)],
);

export type SelectTexts = InferSelectModel<typeof Texts>;
export type InsertTexts = InferInsertModel<typeof Texts>;
