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
import { stockMovementReasons, stockMovementTypes } from "../../lib/enums";
import { Products } from "./products";
import { Stock } from "./stock";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseInvoices } from "./purchase-invoices";
import { Orders } from "./orders";
import { Invoices } from "./invoices";
import { WarehouseWorkOrderLines } from "./warehouse-work-orders";
import { ProductionWorkOrderLines } from "./production-work-orders";
import { TransportWorkOrders } from "./transport-work-orders";

export const StockMovements = mysqlTable(
  "StockMovements",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    stockUuid: char("stock_uuid", { length: 36 }).notNull(),

    type: mysqlEnum("type", stockMovementTypes).notNull(),
    reason: mysqlEnum("reason", stockMovementReasons).notNull(),
    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    // The same movement measured the other two ways the reference reports it.
    // Its `Stock mutations` and `Control stock increase` exports both print
    // `MutationQty` three times — in the lot's own stock unit, in kilos and in
    // euros — and the three are not derivable from one another here: the kilos
    // are weighed rather than calculated, and the euro value is struck at the
    // lot's valuation price at the moment the movement happened, which a later
    // revaluation must not move.
    //
    // Both are nullable: a movement recorded before this pair existed has no
    // truthful answer, and zero is a real value that must stay distinguishable
    // from "not recorded".
    quantityKg: decimal("quantity_kg", { precision: 15, scale: 2 }),
    valueEur: decimal("value_eur", { precision: 15, scale: 2 }),
    note: varchar("note", { length: 255 }),

    // Purchase order this movement is tied to — the original "in" receipt,
    // or the "out" reversal logged when that order is cancelled.
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    // Purchase invoice this movement is tied to — the "out" consumption,
    // or the "in" reversal logged when that invoice is cancelled.
    purchaseInvoiceUuid: char("purchase_invoice_uuid", { length: 36 }),

    // Sales order this movement is tied to — set for the reservation's
    // eventual "out" consumption once billed.
    orderUuid: char("order_uuid", { length: 36 }),
    // Sales invoice this movement is tied to — the "out" consumption, or the
    // "in" reversal logged when that invoice is cancelled.
    invoiceUuid: char("invoice_uuid", { length: 36 }),

    // ── What actually moved the metal ─────────────────────────────────────
    // The four links above answer "which order is this about". These answer
    // "what moved it", which is a different question and the one the reference
    // puts in a column of its own.
    //
    // In its 13.562-movement export, 10.464 of the 10.584 real movements name
    // the document behind them and not one of the 2.978 corrections does. So a
    // movement with none of these set is a correction — somebody adjusted the
    // books — and that is the whole taxonomy.
    //
    // The cause is polymorphic, which is why there are three: goods arrive on a
    // warehouse work order, but 4.189 of the 5.043 customer deliveries leave on
    // a TRIP, against 854 on a work order.
    warehouseWorkOrderLineUuid: char("warehouse_work_order_line_uuid", {
      length: 36,
    }),
    productionWorkOrderLineUuid: char("production_work_order_line_uuid", {
      length: 36,
    }),
    transportWorkOrderUuid: char("transport_work_order_uuid", { length: 36 }),

    // Clerk user id of whoever triggered this movement.
    createdByUserId: varchar("created_by_user_id", { length: 255 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_stock_movements_product_uuid").on(table.productUuid),
    index("idx_stock_movements_stock_uuid").on(table.stockUuid),
    index("idx_stock_movements_reason").on(table.reason),
    index("idx_stock_movements_purchase_order_uuid").on(
      table.purchaseOrderUuid,
    ),
    index("idx_stock_movements_purchase_invoice_uuid").on(
      table.purchaseInvoiceUuid,
    ),
    index("idx_stock_movements_order_uuid").on(table.orderUuid),
    index("idx_stock_movements_invoice_uuid").on(table.invoiceUuid),
    // "Everything that went out" is the common narrowing on this list, and the
    // column has two values — so an index on it is what turns that question
    // from a scan of every movement ever made into a seek.
    index("idx_stock_movements_type").on(table.type),
    // The default ordering, newest first, with the tiebreaker paging needs.
    index("idx_stock_movements_created_at_id").on(table.createdAt, table.id),
    foreignKey({
      name: "fk_stock_movements_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_purchase_invoice",
      columns: [table.purchaseInvoiceUuid],
      foreignColumns: [PurchaseInvoices.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_invoice",
      columns: [table.invoiceUuid],
      foreignColumns: [Invoices.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_warehouse_work_order_line",
      columns: [table.warehouseWorkOrderLineUuid],
      foreignColumns: [WarehouseWorkOrderLines.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_production_work_order_line",
      columns: [table.productionWorkOrderLineUuid],
      foreignColumns: [ProductionWorkOrderLines.uuid],
    }),
    foreignKey({
      name: "fk_stock_movements_transport_work_order",
      columns: [table.transportWorkOrderUuid],
      foreignColumns: [TransportWorkOrders.uuid],
    }),
  ],
);

export type SelectStockMovements = InferSelectModel<typeof StockMovements>;
export type InsertStockMovements = InferInsertModel<typeof StockMovements>;
