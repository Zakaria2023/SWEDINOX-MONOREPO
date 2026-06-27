import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  float,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  contractableRoles,
  contractDiscountBasedOnTypes,
  contractSurchargePerTypes,
  contractTierUnits,
  contractTypes,
} from "../../lib/enums";

import { Companies } from "./companies";
import { Orders } from "./orders";
import { PurchaseOrders } from "./purchase-orders";

type PriceTier = { from: number; percentage: number };

export const ContractGroups = mysqlTable(
  "ContractGroups",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }),

    contractSubgroupUuid: char("contract_subgroup_uuid", { length: 36 }),
    sequenceWithinSubgroup: int("sequence_within_subgroup")
      .default(0)
      .notNull(),
    quicklyChangeSequenceNumber: varchar("quickly_change_sequence_number", {
      length: 100,
    }),

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
  "Contracts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),
    orderUuid: char("order_uuid", { length: 36 }),
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    role: mysqlEnum("role", contractableRoles),

    code: varchar("code", { length: 50 }).notNull(),

    contractType: mysqlEnum("contract_type", contractTypes),

    description: varchar("description", { length: 255 }).notNull(),

    contractGroupUuid: char("contract_group_uuid", { length: 36 }),

    quicklyChangeOrder: varchar("quickly_change_order", { length: 100 }),
    hasPriceDate: boolean("has_price_date").default(false),
    priceDate: varchar("price_date", { length: 10 }),
    linkToNewCustomer: boolean("link_to_new_customer").default(false),

    startingDate: varchar("starting_date", { length: 10 }),
    endDate: varchar("end_date", { length: 10 }),
    salesKg: float("sales_kg").default(0),
    revenue: float("revenue").default(0),
    maxWeightKg: float("max_weight_kg").default(0),

    searchCode1: varchar("search_code_1", { length: 100 }),
    searchCode2: varchar("search_code_2", { length: 100 }),
    searchCode3: varchar("search_code_3", { length: 100 }),

    websiteSorting: int("website_sorting").default(10),
    hideOnWebsite: boolean("hide_on_website").default(false),

    // Details tab — Gross prices
    grossPrice: boolean("gross_price").default(false),
    grossPriceValue: decimal("gross_price_value", { precision: 15, scale: 2 }),

    // Details tab — Color surcharge
    colorSurcharge: boolean("color_surcharge").default(false),
    colorSurchargeValue: decimal("color_surcharge_value", { precision: 15, scale: 2 }),
    colorSurchargeUnit: varchar("color_surcharge_unit", { length: 10 }),

    // Details tab — Extra discount
    extraDiscount: boolean("extra_discount").default(false),
    extraDiscountValue: decimal("extra_discount_value", { precision: 15, scale: 2 }),
    extraDiscountUnit: varchar("extra_discount_unit", { length: 10 }),
    extraDiscountFromValue: decimal("extra_discount_from_value", { precision: 15, scale: 2 }),
    extraDiscountFromUnit: varchar("extra_discount_from_unit", { length: 10 }),

    // Details tab — Quantity surcharge (Hoeveelheidstoeslag)
    quantitySurcharge: boolean("quantity_surcharge").default(false),
    quantitySurchargeTierUnit: mysqlEnum("quantity_surcharge_tier_unit", contractTierUnits),
    quantitySurchargeDiscountUnit: varchar("quantity_surcharge_discount_unit", { length: 10 }),
    quantitySurchargeTiers: json("quantity_surcharge_tiers").$type<PriceTier[]>().default([]).notNull(),
    quantitySurchargePerType: mysqlEnum("quantity_surcharge_per_type", contractSurchargePerTypes),
    quantitySurchargeProductGroupUuid: char("quantity_surcharge_product_group_uuid", { length: 36 }),

    // Details tab — Line discount (Regelkorting)
    lineDiscount: boolean("line_discount").default(false),
    lineDiscountTierUnit: mysqlEnum("line_discount_tier_unit", contractTierUnits),
    lineDiscountDiscountUnit: varchar("line_discount_discount_unit", { length: 10 }),
    lineDiscountTiers: json("line_discount_tiers").$type<PriceTier[]>().default([]).notNull(),

    // Details tab — Group discount (Groepskorting)
    groupDiscount: boolean("group_discount").default(false),
    groupDiscountTierUnit: mysqlEnum("group_discount_tier_unit", contractTierUnits),
    groupDiscountDiscountUnit: varchar("group_discount_discount_unit", { length: 10 }),
    groupDiscountTiers: json("group_discount_tiers").$type<PriceTier[]>().default([]).notNull(),
    groupDiscountBasedOn: mysqlEnum("group_discount_based_on", contractDiscountBasedOnTypes),
    groupDiscountProductGroupUuid: char("group_discount_product_group_uuid", { length: 36 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contracts_company_uuid").on(table.companyUuid),
    index("idx_contracts_order_uuid").on(table.orderUuid),
    index("idx_contracts_purchase_order_uuid").on(table.purchaseOrderUuid),
    index("idx_contracts_contract_group_uuid").on(table.contractGroupUuid),
    foreignKey({
      name: "fk_contracts_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_contracts_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_contracts_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
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
