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
import { stockUnits } from "../../lib/enums";
import { Products } from "./products";

// Pick statistic — the Logistics "Pick statistic" overview. One row per
// product per month (derived from the pick's "Date reported as completed"),
// aggregating how often and how much of that product was picked. The average
// per-pick figures are computed at query time, not stored.
export const PickStatistics = mysqlTable(
  "PickStatistics",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),

    // The period the picks were completed in ("Year" / "Month").
    year: int("year").notNull(),
    month: int("month").notNull(),

    // "Picks" (count), "Qty. Picked / Fetched" in its unit ("U.") and the
    // total weight picked ("Kg. Picked").
    picks: int("picks").notNull().default(0),
    quantityPicked: decimal("quantity_picked", {
      precision: 15,
      scale: 3,
    })
      .notNull()
      .default("0.000"),
    unit: mysqlEnum("unit", stockUnits),
    kgPicked: decimal("kg_picked", { precision: 15, scale: 3 })
      .notNull()
      .default("0.000"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_pick_statistics_product_uuid").on(table.productUuid),
    index("idx_pick_statistics_period").on(table.year, table.month),
    foreignKey({
      name: "fk_pick_statistics_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectPickStatistics = InferSelectModel<typeof PickStatistics>;
export type InsertPickStatistics = InferInsertModel<typeof PickStatistics>;
