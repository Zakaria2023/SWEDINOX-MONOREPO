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
  varchar,
} from "drizzle-orm/mysql-core";
import {
  deliveryStatuses,
  orderItemStatuses,
  orderLineStatuses,
  orderSourceTypes,
  stockUnits,
} from "../../lib/enums";
import { Orders } from "./orders";
import { Products } from "./products";
import { PurchaseOrderItems } from "./purchase-order-items";
import { PurchaseOrders } from "./purchase-orders";
import { Stock } from "./stock";

export const OrderItems = mysqlTable(
  "OrderItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    orderUuid: char("order_uuid", { length: 36 }).notNull(),
    stockUuid: char("stock_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }).notNull(),

    // Amount reserved from stockUuid — never changes after creation. Released
    // in full when cancelled.
    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    // How much of that quantity has been billed. A line can be invoiced in
    // instalments — a customer calling off half a bundle and being billed for
    // what they took — so the line only reaches "invoiced" once this reaches
    // `quantity`, and stays billable for the remainder until it does.
    //
    // Held as the running total rather than derived from the invoice lines
    // because it is what the optimistic guard compares against: two invoices
    // raised at once must not each bill the same remaining quantity.
    invoicedQuantity: decimal("invoiced_quantity", {
      precision: 15,
      scale: 3,
    })
      .default("0.000")
      .notNull(),
    status: mysqlEnum("status", orderItemStatuses)
      .default("reserved")
      .notNull(),

    // ── Line identity ─────────────────────────────────────────────────────────
    lineNumber: int("line_number"),
    // Ours: `material` and its siblings. The reference has no such column —
    // options and surcharges are separate tables there — so this is not the
    // reference's `Line type`. That one is `sourceType` below.
    lineType: varchar("line_type", { length: 50 }),

    // Where this line's metal comes from — the reference's `Line type`, and the
    // `Order type` column on its revenue screens once it is rolled up.
    //
    //   Stk     1.935 lines     bought out of stock
    //   Stk+CD     31 lines     partly stock, partly bought in
    //   CD          4 lines     bought against this sale
    //
    // Worth a column of its own because the two trade at very different
    // margins: 20,09 % on Stk against 10,55 % on CD, over a quarter of the
    // volume. See `docs/reference-system/order-types.md`.
    sourceType: mysqlEnum("source_type", orderSourceTypes)
      .default("stock")
      .notNull(),
    // The purchase line that covers a cross-docked sale. The reference's `CD
    // deliveries in progress` prints both keys on one row, which is the whole
    // point of a cross-dock: these goods were bought for this sale.
    //
    // A real foreign key, unlike `Stock.orderItemUuid`: nothing in the purchase
    // chain imports this file, so pointing at it closes no module cycle.
    purchaseOrderItemUuid: char("purchase_order_item_uuid", {
      length: 36,
    }).references(() => PurchaseOrderItems.uuid, { onDelete: "set null" }),
    seller: varchar("seller", { length: 255 }),

    // ── Fulfilment / delivery ─────────────────────────────────────────────────
    lineStatus: mysqlEnum("line_status", orderLineStatuses).default(
      "in_progress",
    ),
    deliveryStatus: mysqlEnum("delivery_status", deliveryStatuses).default(
      "new",
    ),
    deliveryDate: date("delivery_date", { mode: "string" }),
    reservationDate: date("reservation_date", { mode: "string" }),
    isPickup: boolean("is_pickup").default(false),
    lastWarehouseWorkOrder: varchar("last_warehouse_work_order", {
      length: 100,
    }),

    // ── Blocking ──────────────────────────────────────────────────────────────
    commercialBlock: boolean("commercial_block").default(false),
    financialBlock: boolean("financial_block").default(false),
    transportBlock: boolean("transport_block").default(false),
    blockingReason: varchar("blocking_reason", { length: 255 }),

    // ── Physical attributes ───────────────────────────────────────────────────
    unit: mysqlEnum("unit", stockUnits).default("st"),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    options: varchar("options", { length: 255 }),

    // ── Quantities (planned / actual / call-off) in units and kg ──────────────
    qtyPlanned: decimal("qty_planned", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyActual: decimal("qty_actual", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    qtyCallOff: decimal("qty_call_off", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgPlanned: decimal("kg_planned", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    kgActual: decimal("kg_actual", { precision: 15, scale: 2 }).default("0.00"),
    kgCallOff: decimal("kg_call_off", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    qtyReserved: decimal("qty_reserved", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgReserved: decimal("kg_reserved", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // ── Purchase link (for lines drawn from a purchase order) ─────────────────
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    qtyPurchased: decimal("qty_purchased", { precision: 15, scale: 3 }).default(
      "0.000",
    ),
    kgPurchased: decimal("kg_purchased", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // ── Pricing ───────────────────────────────────────────────────────────────
    grossPrice: decimal("gross_price", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceUnit: varchar("price_unit", { length: 10 }),
    lineDiscount: decimal("line_discount", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    groupDiscount: decimal("group_discount", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

    // ── Cost basis ────────────────────────────────────────────────────────────
    // An order line is allocated to a specific stock lot, so unlike a quote it
    // knows exactly what the goods cost: the lot's own valuation price. That is
    // snapshotted here at reservation rather than read live, because a later
    // revaluation must not silently move the margin already recorded against a
    // shipped order.
    //
    // The replacement price is kept alongside it for the same reason quotes do:
    // profit against what it cost and profit against what re-buying it costs
    // today are different numbers, and a falling market makes the second the
    // honest one.
    costPrice: decimal("cost_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    costAmount: decimal("cost_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    replacementPrice: decimal("replacement_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),
    profitMargin: decimal("profit_margin", { precision: 6, scale: 2 }).default(
      "0.00",
    ),
    profitReplPrice: decimal("profit_repl_price", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    // Flagged when the line's margin falls under the product group's floor.
    profitTooLow: boolean("profit_too_low").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_order_items_order_uuid").on(table.orderUuid),
    index("idx_order_items_stock_uuid").on(table.stockUuid),
    index("idx_order_items_product_uuid").on(table.productUuid),
    index("idx_order_items_purchase_order_uuid").on(table.purchaseOrderUuid),
    // The overview filters on these two, and this is the table that grows
    // fastest — one row per line of every order ever taken. Without them a
    // status filter reads every row to return fifty.
    index("idx_order_items_line_status").on(table.lineStatus),
    index("idx_order_items_delivery_date").on(table.deliveryDate),
    // The default ordering of the order-lines overview, newest first, with the
    // unique tiebreaker paging depends on. As one index the sort is a range
    // scan rather than a filesort over the whole table.
    index("idx_order_items_created_at_id").on(table.createdAt, table.id),
    foreignKey({
      name: "fk_order_items_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_order_items_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_order_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_order_items_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
  ],
);

export type SelectOrderItems = InferSelectModel<typeof OrderItems>;
export type InsertOrderItems = InferInsertModel<typeof OrderItems>;
