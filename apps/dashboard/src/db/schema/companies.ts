import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { companyLangs, CompanyRole } from "../../lib/enums";

export const Companies = mysqlTable("Companies", {
  id: int("id").primaryKey().autoincrement(),
  uuid: char("uuid", { length: 36 }).notNull().unique(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  correspName: varchar("corresp_name", { length: 255 }),
  lang: mysqlEnum("lang", companyLangs),
  remarks: text("remarks"),
  searchCode1: varchar("search_code_1", { length: 100 }),
  searchCode2: varchar("search_code_2", { length: 100 }),
  searchCode3: varchar("search_code_3", { length: 100 }),
  roles: json("roles").$type<CompanyRole[]>().default([]).notNull(),
  documents: json("documents").$type<Array<{ id: string; fileName: string }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SelectCompanies = InferSelectModel<typeof Companies>;
export type InsertCompanies = InferInsertModel<typeof Companies>;
