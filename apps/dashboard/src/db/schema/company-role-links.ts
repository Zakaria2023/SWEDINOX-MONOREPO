import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { companyRoles } from "../../lib/enums";
import { Companies } from "./companies";

export const CompanyRoleLinks = mysqlTable(
  "company_role_links",
  {
    id: int("id").primaryKey().autoincrement(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    role: mysqlEnum("role", companyRoles).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_company_role_links_company_uuid").on(table.companyUuid),
    index("idx_company_role_links_role").on(table.role),
    foreignKey({
      name: "fk_company_role_links_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectCompanyRoleLinks = InferSelectModel<typeof CompanyRoleLinks>;
export type InsertCompanyRoleLinks = InferInsertModel<typeof CompanyRoleLinks>;
