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
  varchar,
} from "drizzle-orm/mysql-core";
import { stockUnits } from "../../lib/enums";
import { Products } from "./products";

// Count-list deviation — the Logistics "Deviations in count lists" overview.
// Each row is a discrepancy found when a stock-count workorder is booked:
// the counted product/location with the old vs. new stock (quantity and kg)
// and the value ("Amount") of the correction.
export const CountListDeviations = mysqlTable(
  "CountListDeviations",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // The count workorder this deviation was booked under, its date, and who
    // booked it ("Workorder #", "Workorder date", "Booked by").
    workOrderNumber: varchar("work_order_number", { length: 100 }),
    workOrderDate: date("work_order_date"),
    bookedBy: varchar("booked_by", { length: 255 }),

    // Where the item was counted ("Location") and the product counted —
    // backs the Product and Length (mm) columns via join.
    location: varchar("location", { length: 100 }),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    // The correction itself: quantity ("Qty."), its unit ("U."), weight
    // ("Kg."), value ("Amount") and the source document ("Document").
    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    unit: mysqlEnum("unit", stockUnits),
    kg: decimal("kg", { precision: 15, scale: 3 }),
    amount: decimal("amount", { precision: 15, scale: 2 }),
    documentReference: varchar("document_reference", { length: 100 }),

    // Stock before vs. after the correction, in both quantity and kg.
    oldStockQty: decimal("old_stock_qty", { precision: 15, scale: 3 }),
    oldStockKg: decimal("old_stock_kg", { precision: 15, scale: 3 }),
    newStockQty: decimal("new_stock_qty", { precision: 15, scale: 3 }),
    newStockKg: decimal("new_stock_kg", { precision: 15, scale: 3 }),

    // "Date reported as completed".
    dateReportedAsCompleted: date("date_reported_as_completed"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_count_list_deviations_product_uuid").on(table.productUuid),
    index("idx_count_list_deviations_work_order_date").on(table.workOrderDate),
    foreignKey({
      name: "fk_count_list_deviations_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectCountListDeviations = InferSelectModel<
  typeof CountListDeviations
>;
export type InsertCountListDeviations = InferInsertModel<
  typeof CountListDeviations
>;
