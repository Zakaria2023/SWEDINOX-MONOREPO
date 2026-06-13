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
import { contractableRoles } from "../../lib/enums";
import { Companies } from "./companies";
import { Contracts } from "./contracts";

export const CompanyContractLinks = mysqlTable(
  "company_contract_links",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contractUuid: char("contract_uuid", { length: 36 }).notNull(),
    role: mysqlEnum("role", contractableRoles).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_company_contract_links_company").on(table.companyUuid),
    index("idx_company_contract_links_contract").on(table.contractUuid),
    foreignKey({
      name: "fk_company_contract_links_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_company_contract_links_contract",
      columns: [table.contractUuid],
      foreignColumns: [Contracts.uuid],
    }),
  ],
);

export type SelectCompanyContractLinks = InferSelectModel<typeof CompanyContractLinks>;
export type InsertCompanyContractLinks = InferInsertModel<typeof CompanyContractLinks>;
