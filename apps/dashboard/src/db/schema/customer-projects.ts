import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { Companies } from "./companies";
import { Contracts } from "./contracts";

export const CustomerProjects = mysqlTable(
  "CustomerProjects",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),
    contractUuid: char("contract_uuid", { length: 36 }),

    projectName: varchar("project_name", { length: 255 }),
    startingDate: date("starting_date"),
    endDate: date("end_date"),
    revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0.00").notNull(),
    daysInSystem: int("days_in_system").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_customer_projects_company_uuid").on(table.companyUuid),
    index("idx_customer_projects_contract_uuid").on(table.contractUuid),
    foreignKey({
      name: "fk_customer_projects_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_customer_projects_contract",
      columns: [table.contractUuid],
      foreignColumns: [Contracts.uuid],
    }),
  ],
);

export type SelectCustomerProjects = InferSelectModel<typeof CustomerProjects>;
export type InsertCustomerProjects = InferInsertModel<typeof CustomerProjects>;
