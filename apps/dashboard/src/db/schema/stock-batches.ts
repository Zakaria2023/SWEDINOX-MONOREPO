import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { Batches } from "./batches";
import { Stock } from "./stock";

// Which batches a stock lot holds, and how much of each. The reference keeps
// this as its own table (`STOCKBATCH`: stock, batch, quantity) because a lot is
// not one batch: bundles are combined on the rack and a batch spreads over
// several lots. `Batches.stockUuid` names the lot a batch was registered on;
// this is what tracing a delivered sheet reads.
export const StockBatches = mysqlTable(
  "StockBatches",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    stockUuid: char("stock_uuid", { length: 36 }).notNull(),
    batchUuid: char("batch_uuid", { length: 36 }).notNull(),
    quantity: decimal("quantity", { precision: 15, scale: 3 })
      .default("0.000")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_stock_batches_stock_batch").on(
      table.stockUuid,
      table.batchUuid,
    ),
    index("idx_stock_batches_batch_uuid").on(table.batchUuid),
    foreignKey({
      name: "fk_stock_batches_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_stock_batches_batch",
      columns: [table.batchUuid],
      foreignColumns: [Batches.uuid],
    }),
  ],
);

export type SelectStockBatches = InferSelectModel<typeof StockBatches>;
export type InsertStockBatches = InferInsertModel<typeof StockBatches>;
