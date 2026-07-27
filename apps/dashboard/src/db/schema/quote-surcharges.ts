import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { contractTierUnits, invoiceSurchargeDescriptions } from "../../lib/enums";
import { Companies } from "./companies";
import { Quotes } from "./quotes";

// A surcharge quoted on top of the material and option lines — scrap surcharge,
// alloy surcharge, small-order fee and the like. Mirrors OrderSurcharges so the
// amounts survive the quote being turned into an order.
//
// The quote's summary reports surcharges as their own revenue/profit row, which
// is why they are a table of their own rather than extra lines.
export const QuoteSurcharges = mysqlTable(
  "QuoteSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    quoteUuid: char("quote_uuid", { length: 36 }),
    companyUuid: char("company_uuid", { length: 36 }),

    order: int("order").default(0),
    description: mysqlEnum("description", invoiceSurchargeDescriptions),
    surcharge: decimal("surcharge", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    unit: varchar("unit", { length: 50 }),
    fromValue: decimal("from_value", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    unitIndication: varchar("unit_indication", { length: 50 }),
    tierUnit: mysqlEnum("tier_unit", contractTierUnits),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),
    thirdParties: boolean("third_parties").default(false),
    companyCode: varchar("company_code", { length: 100 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_quote_surcharges_quote_uuid").on(table.quoteUuid),
    index("idx_quote_surcharges_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_quote_surcharges_quote",
      columns: [table.quoteUuid],
      foreignColumns: [Quotes.uuid],
    }),
    foreignKey({
      name: "fk_quote_surcharges_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectQuoteSurcharges = InferSelectModel<typeof QuoteSurcharges>;
export type InsertQuoteSurcharges = InferInsertModel<typeof QuoteSurcharges>;
