import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
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
import { transporterPriceUnits } from "../../lib/enums";
import { Companies } from "./companies";

// Transporter cost tiers — priced per validity window and KM/KG range.
export const TransporterCosts = mysqlTable(
  "TransporterCosts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    fromDate: date("from_date", { mode: "string" }),
    untilDate: date("until_date", { mode: "string" }),
    nowValid: boolean("now_valid").default(true),
    fromKm: decimal("from_km", { precision: 12, scale: 3 }).default("0.000"),
    untilKm: decimal("until_km", { precision: 12, scale: 3 }).default("0.000"),
    fromKg: decimal("from_kg", { precision: 12, scale: 3 }).default("0.000"),
    untilKg: decimal("until_kg", { precision: 12, scale: 3 }).default("0.000"),
    price: decimal("price", { precision: 15, scale: 2 }).default("0.00"),
    priceUnit: mysqlEnum("price_unit", transporterPriceUnits).default("amount"),
    minAmount: decimal("min_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    maxAmount: decimal("max_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_transporter_costs_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_transporter_costs_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectTransporterCosts = InferSelectModel<typeof TransporterCosts>;
export type InsertTransporterCosts = InferInsertModel<typeof TransporterCosts>;
