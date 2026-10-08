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
  varchar,
} from "drizzle-orm/mysql-core";
import { stockOptions, stockUnits } from "../../lib/enums";
import { PurchaseOrderItems } from "./purchase-order-items";
import { PurchaseOrders } from "./purchase-orders";

// 🔑 `Options` on a purchase line: the processing step bought, not metal (C10
// of PLANNED-CODE-CHANGES-8). Purchase order `400066` (Helaxa, `Processing`)
// carried one row — `Decoilen`, Qty 1 ST, gross € 110,00 per TN, discount 0 %,
// reference factor 1, net € 110,00, amount € 99,00 — and its metal lines at
// € 0,00, so the order was worth exactly its option. € 110/TN × 0,900 t = €
// 99,00: the option is priced on the weight **received**, not the 1 134 kg
// that went out.
export const PurchaseOrderItemOptions = mysqlTable(
  "PurchaseOrderItemOptions",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }).notNull(),
    purchaseOrderItemUuid: char("purchase_order_item_uuid", {
      length: 36,
    }).notNull(),

    sortOrder: int("sort_order").default(10),
    option: mysqlEnum("option", stockOptions).notNull(),
    quantity: decimal("quantity", { precision: 15, scale: 3 }).default("1.000"),
    unit: mysqlEnum("unit", stockUnits).default("st"),
    grossPrice: decimal("gross_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    // `Per` — what the price is struck against: `TN` (decoiling), `M2`
    // (grinding, foil), `ST`.
    per: varchar("per", { length: 10 }).default("TN"),
    discountPercent: decimal("discount_percent", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    referenceFactor: decimal("reference_factor", {
      precision: 10,
      scale: 4,
    }).default("1.0000"),
    netPrice: decimal("net_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_order_item_options_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_purchase_order_item_options_item_uuid").on(
      table.purchaseOrderItemUuid,
    ),
    foreignKey({
      name: "fk_purchase_order_item_options_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_purchase_order_item_options_item",
      columns: [table.purchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }).onDelete("cascade"),
  ],
);

export type SelectPurchaseOrderItemOptions = InferSelectModel<
  typeof PurchaseOrderItemOptions
>;
export type InsertPurchaseOrderItemOptions = InferInsertModel<
  typeof PurchaseOrderItemOptions
>;
