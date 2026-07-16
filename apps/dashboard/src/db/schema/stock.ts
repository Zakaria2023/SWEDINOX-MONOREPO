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

    // ── Ownership ─────────────────────────────────────────────────────────────
    // The supplier the lot was sourced from (shown as "Supplier" on the grid).
    supplierUuid: char("supplier_uuid", { length: 36 }),
    // Owner of the stock when it isn't ours — set for customer/consignment
    // stock ("Klant voorraad op locatie"); null means it's our own stock.
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
    index("idx_stock_purchase_order_uuid").on(table.purchaseOrderUuid),
    index("idx_stock_purchase_order_item_uuid").on(
      table.purchaseOrderItemUuid,
    ),
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
