import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { Companies } from "./companies";

export const AddressDistances = mysqlTable(
  "AddressDistances",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),

    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 150 }),
    street: varchar("street", { length: 255 }),
    postalCode: varchar("postal_code", { length: 50 }),
    km: decimal("km", { precision: 10, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_address_distances_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_address_distances_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectAddressDistances = InferSelectModel<typeof AddressDistances>;
export type InsertAddressDistances = InferInsertModel<typeof AddressDistances>;
