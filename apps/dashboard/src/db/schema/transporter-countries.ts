import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { deliveryTerms, transporterCountries } from "../../lib/enums";
import { Companies } from "./companies";

// Countries a transporter serves, with delivery terms and per-country limits.
export const TransporterCountries = mysqlTable(
  "TransporterCountries",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    country: mysqlEnum("country", transporterCountries),
    deliveryTerms: mysqlEnum("delivery_terms", deliveryTerms),
    maxKg: decimal("max_kg", { precision: 12, scale: 3 }).default("0.000"),
    surchargePercentage: decimal("surcharge_percentage", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_transporter_countries_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_transporter_countries_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectTransporterCountries = InferSelectModel<
  typeof TransporterCountries
>;
export type InsertTransporterCountries = InferInsertModel<
  typeof TransporterCountries
>;
