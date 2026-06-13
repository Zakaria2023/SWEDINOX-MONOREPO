import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { contractTypes } from "../../lib/enums";

export const ContractGroups = mysqlTable(
  "contract_groups",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }),

    contractSubgroupUuid: char("contract_subgroup_uuid", { length: 36 }),
    sequenceWithinSubgroup: int("sequence_within_subgroup").default(0).notNull(),
    quicklyChangeSequenceNumber: varchar("quickly_change_sequence_number", { length: 100 }),

    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contract_groups_subgroup_uuid").on(table.contractSubgroupUuid),
    foreignKey({
      name: "fk_contract_groups_subgroup",
      columns: [table.contractSubgroupUuid],
      foreignColumns: [table.uuid],
    }),
  ],
);

export const Contracts = mysqlTable(
  "contracts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    code: varchar("code", { length: 50 }).notNull(),

    contractType: mysqlEnum("contract_type", contractTypes),

    description: varchar("description", { length: 255 }).notNull(),

    contractGroupUuid: char("contract_group_uuid", { length: 36 }),

    quicklyChangeOrder: varchar("quickly_change_order", { length: 100 }),
    hasPriceDate: boolean("has_price_date").default(false),
    priceDate: varchar("price_date", { length: 10 }),
    linkToNewCustomer: boolean("link_to_new_customer").default(false),

    searchCode1: varchar("search_code_1", { length: 100 }),
    searchCode2: varchar("search_code_2", { length: 100 }),
    searchCode3: varchar("search_code_3", { length: 100 }),

    websiteSorting: int("website_sorting").default(10),
    hideOnWebsite: boolean("hide_on_website").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contracts_contract_group_uuid").on(table.contractGroupUuid),
    foreignKey({
      name: "fk_contracts_contract_group",
      columns: [table.contractGroupUuid],
      foreignColumns: [ContractGroups.uuid],
    }),
  ],
);

export type SelectContractGroups = InferSelectModel<typeof ContractGroups>;
export type InsertContractGroups = InferInsertModel<typeof ContractGroups>;
export type SelectContracts = InferSelectModel<typeof Contracts>;
export type InsertContracts = InferInsertModel<typeof Contracts>;
