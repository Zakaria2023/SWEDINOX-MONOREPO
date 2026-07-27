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
import { Orders } from "./orders";
import { RevenueGroups } from "./revenue-groups";

// Sales charges / surcharges billed on top of the order lines —
// e.g. small-order, cutting or scrap surcharges, grouped by revenue group.
export const Charges = mysqlTable(
  "Charges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),
    orderUuid: char("order_uuid", { length: 36 }),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),

    orderType: varchar("order_type", { length: 100 }),
    code: varchar("code", { length: 100 }),
    creationDate: date("creation_date", { mode: "string" }),
    deliveryDate: date("delivery_date", { mode: "string" }),
    surcharge: varchar("surcharge", { length: 255 }),
    contract: varchar("contract", { length: 100 }),

    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    cost: decimal("cost", { precision: 15, scale: 2 }).default("0.00").notNull(),
    profit: decimal("profit", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    weightKg: decimal("weight_kg", { precision: 15, scale: 2 }).default("0.00"),
    // Surcharge tier: applies between `priceFrom` and `priceTo` at `price`.
    priceFrom: decimal("price_from", { precision: 15, scale: 2 }),
    priceTo: decimal("price_to", { precision: 15, scale: 2 }),
    price: decimal("price", { precision: 15, scale: 2 }),
    unit: varchar("unit", { length: 10 }),

    debtorNo: varchar("debtor_no", { length: 100 }),
    region: varchar("region", { length: 100 }),
    country: varchar("country", { length: 100 }),
    vatNumber: varchar("vat_number", { length: 100 }),
    status: varchar("status", { length: 50 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_charges_company_uuid").on(table.companyUuid),
    index("idx_charges_order_uuid").on(table.orderUuid),
    index("idx_charges_revenue_group_uuid").on(table.revenueGroupUuid),
    foreignKey({
      name: "fk_charges_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_charges_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_charges_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
  ],
);

export type SelectCharges = InferSelectModel<typeof Charges>;
export type InsertCharges = InferInsertModel<typeof Charges>;
