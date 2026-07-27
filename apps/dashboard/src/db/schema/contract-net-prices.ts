import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { salesUnitOptions } from "../../lib/enums";
import { Contracts } from "./contracts";
import { Products } from "./products";

// The agreed price of one product under one contract — what the customer
// actually pays once the contract's discounts have been taken off the product's
// base price. Backs the "Net prices" overview.
//
// A contract with quantity tiers produces one row per tier: `fromQty` is the
// quantity the price starts to apply at, so a bigger order finds a cheaper row.
export const ContractNetPrices = mysqlTable(
  "ContractNetPrices",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    contractUuid: char("contract_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    netPriceUnit: mysqlEnum("net_price_unit", salesUnitOptions),

    // The total discount that got from the base price to this net price, kept
    // so the overview can explain the number without re-deriving it.
    discountPercent: decimal("discount_percent", {
      precision: 6,
      scale: 2,
    }).default("0.00"),

    fromQty: decimal("from_qty", { precision: 15, scale: 3 }).default("0.000"),
    fromQtyUnit: mysqlEnum("from_qty_unit", salesUnitOptions),

    validFrom: date("valid_from", { mode: "string" }),
    validUntil: date("valid_until", { mode: "string" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contract_net_prices_contract_uuid").on(table.contractUuid),
    index("idx_contract_net_prices_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_contract_net_prices_contract",
      columns: [table.contractUuid],
      foreignColumns: [Contracts.uuid],
    }),
    foreignKey({
      name: "fk_contract_net_prices_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectContractNetPrices = InferSelectModel<
  typeof ContractNetPrices
>;
export type InsertContractNetPrices = InferInsertModel<
  typeof ContractNetPrices
>;
