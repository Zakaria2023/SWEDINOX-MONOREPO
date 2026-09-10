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
import { stockStatuses, stockUnits } from "../../lib/enums";
import { Companies } from "./companies";
import { Products } from "./products";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseOrderItems } from "./purchase-order-items";
import { Warehouses } from "./warehouses";

export const Stock = mysqlTable(
  "Stock",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    productUuid: char("product_uuid", { length: 36 }).notNull(),
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    purchaseOrderItemUuid: char("purchase_order_item_uuid", { length: 36 }),

    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    // How much of `quantity` is earmarked by open sales order reservations —
    // available to sell/invoice is always `quantity - reservedQuantity`.
    reservedQuantity: decimal("reserved_quantity", { precision: 15, scale: 3 })
      .default("0.000")
      .notNull(),
    status: mysqlEnum("status", stockStatuses).default("pending").notNull(),

    // ── Location (a leaf row of the Warehouses tree, type = location) ──────────
    locationUuid: char("location_uuid", { length: 36 }),
    blocked: boolean("blocked").default(false),

    // The sales line that cut this lot, when it is a remnant. Most of the
    // warehouse is remnants: of the reference's 2.247 lots, 1.371 name a
    // 1xxxxx sales order as their origin against only 782 naming a purchase.
    // Cut a plate for a customer and what is left goes back on the shelf still
    // carrying the order that cut it.
    //
    // Nullable beside the purchase pair, and both are nullable together: a
    // Customer Materials lot carries no origin at all, no supplier and no
    // charge, because the metal was never ours.
    //
    // No foreign key, unlike its purchase-side twin: `order-items.ts` already
    // imports this file, so importing `OrderItems` back closes a module cycle
    // and Drizzle's inference collapses to `any` across every query that
    // touches stock. The column is the reference to an order line all the same.
    orderItemUuid: char("order_item_uuid", { length: 36 }),

    // ── How a lot is identified ───────────────────────────────────────────────
    //
    // Six fields, and it took until 10-9-2026 to see them together. The Stock
    // panel on the reference's order 100742 prints them side by side, and they
    // are not interchangeable:
    //
    //   Charge          1125372  030325   4A2829D    the mill's heat number
    //   Internal charge 25AAEY   25ACBP   22JDEI     ours: year + four letters
    //   Internal batch  385385   388066   379348     ours: a six-digit series
    //   Batch           P01558765 269338  4A2829D    the supplier's own batch
    //   Factory number  -        -        -          never populated
    //   Plate no.       -        -        -          never populated
    //
    // Two of them coincide on one row (`4A2829D` is both charge and batch) and
    // differ on every other, which is exactly why both are kept.

    // The plate's own number within its heat — `Plaatnummer` on the reception
    // and `Plate no.` on the location's stock panel. Not populated on any of
    // the 13 lots read off order 100742 either, so its format is still unknown.
    plateNumber: varchar("plate_number", { length: 60 }),
    // Our own six-digit running number for the physical bundle, e.g. 385385 /
    // 379348. Carried on the lot and on the warehouse work order line that made
    // it.
    //
    // ⚠️ Named `internal_bundle` until 10-9-2026, when the order's Stock panel
    // showed the reference calls it **`Internal batch`** and keeps a separate
    // `Batch` beside it. The old name invited exactly the confusion that
    // renaming it removes. It had never been written to.
    internalBatch: varchar("internal_batch", { length: 60 }),
    // `Factory number` on the panel — the mill's own works number, blank on all
    // 13 lots read off order 100742 and on every lot seen since. Recorded
    // because it is a field the reference carries, not because it is used.
    factoryNumber: varchar("factory_number", { length: 60 }),

    // ── Ownership ─────────────────────────────────────────────────────────────
    // The supplier the lot was sourced from (shown as "Supplier" on the grid).
    supplierUuid: char("supplier_uuid", { length: 36 }),
    // Owner of the stock when it isn't ours — set for customer/consignment
    // customer stock held at a location; null means it is our own stock.
    ownerCompanyUuid: char("owner_company_uuid", { length: 36 }),

    // ── Physical attributes (as shown on "Stock on location") ─────────────────
    unit: mysqlEnum("unit", stockUnits).default("kg"),
    quantityKg: decimal("quantity_kg", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    quality: varchar("quality", { length: 100 }),
    stockCategory: varchar("stock_category", { length: 100 }),
    options: varchar("options", { length: 255 }),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    charge: varchar("charge", { length: 100 }),
    internalCharge: varchar("internal_charge", { length: 100 }),
    // `Batch` on the reference's stock panels — the supplier's batch number,
    // which is not the heat: charge `030325` arrived as batches 269335, 269336,
    // 269337, 269338, 269339, 269353 and 269354, one per bundle.
    bundle: varchar("bundle", { length: 100 }),
    receiptDate: date("receipt_date", { mode: "string" }),
    remark: varchar("remark", { length: 255 }),

    // ── Valuation (the bridge to accounting / COGS) ───────────────────────────
    // Cost per unit and the resulting stock value ("Valuation price" / "Stock (€)").
    valuationPrice: decimal("valuation_price", { precision: 15, scale: 4 })
      .default("0.0000")
      .notNull(),
    valuationEuro: decimal("valuation_euro", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_stock_product_uuid").on(table.productUuid),
    // Allocation reads pending lots for a product oldest-receipt-first, on every
    // order and every quote conversion — so this composite backs the reservation
    // path, not only the overview's status filter.
    index("idx_stock_status_product_receipt").on(
      table.status,
      table.productUuid,
      table.receiptDate,
    ),
    index("idx_stock_blocked").on(table.blocked),
    index("idx_stock_created_at_id").on(table.createdAt, table.id),
    index("idx_stock_purchase_order_uuid").on(table.purchaseOrderUuid),
    index("idx_stock_purchase_order_item_uuid").on(table.purchaseOrderItemUuid),
    index("idx_stock_location_uuid").on(table.locationUuid),
    index("idx_stock_supplier_uuid").on(table.supplierUuid),
    index("idx_stock_owner_company_uuid").on(table.ownerCompanyUuid),
    foreignKey({
      name: "fk_stock_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_stock_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_stock_purchase_order_item",
      columns: [table.purchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }),
    foreignKey({
      name: "fk_stock_location",
      columns: [table.locationUuid],
      foreignColumns: [Warehouses.uuid],
    }),
    foreignKey({
      name: "fk_stock_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_stock_owner_company",
      columns: [table.ownerCompanyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectStock = InferSelectModel<typeof Stock>;
export type InsertStock = InferInsertModel<typeof Stock>;
