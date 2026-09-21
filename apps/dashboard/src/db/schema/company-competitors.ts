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

/**
 * Who else is selling to this customer.
 *
 * The reference carries a `Competitors` panel on the sales order with four
 * columns — `Firm`, `Revenue share`, `Customer satisfaction`, `Remarks` — and
 * on order 102191, watched on 21-9-2026, it was empty. Those four are the whole
 * of what is known about it; nothing has ever been seen in it.
 *
 * ⚠️ It is modelled against the **company**, not the order it was found on.
 * A share of a customer's spend and how satisfied they are with a rival are
 * facts about the relationship that happen to be shown while an order is open;
 * storing a copy per order would make the same figure disagree with itself
 * across a customer's orders. The panel still reads from the order — through
 * its customer.
 *
 * `firm` is deliberately free text rather than a link to `Companies`. A
 * competitor is not somebody we trade with, so it has no company record, and
 * requiring one would mean inventing rows for firms nobody deals with.
 */
export const CompanyCompetitors = mysqlTable(
  "CompanyCompetitors",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),

    firm: varchar("firm", { length: 255 }).notNull(),
    /** Their share of what this customer buys, as a percentage. */
    revenueSharePercent: decimal("revenue_share_percent", {
      precision: 5,
      scale: 2,
    }),
    /**
     * How happy the customer is with them. Kept as free text: the reference's
     * column header says nothing about a scale, and inventing one — five stars,
     * a percentage, three words — would put a shape on the data that the
     * business has not chosen.
     */
    customerSatisfaction: varchar("customer_satisfaction", { length: 100 }),
    remarks: varchar("remarks", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_company_competitors_company_uuid").on(table.companyUuid),
    foreignKey({
      name: "fk_company_competitors_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectCompanyCompetitors = InferSelectModel<
  typeof CompanyCompetitors
>;
export type InsertCompanyCompetitors = InferInsertModel<
  typeof CompanyCompetitors
>;
