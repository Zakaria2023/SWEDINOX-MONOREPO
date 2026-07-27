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
import { certificaatOptions, stockUnits } from "../../lib/enums";
import { Companies } from "./companies";
import { Products } from "./products";
import { PurchaseLineReceivals } from "./purchase-line-receivals";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseOrderItems } from "./purchase-order-items";
import { Stock } from "./stock";

// A traceable batch of received material. The mill identifies it by its own
// heat/charge number; `internalCharge` is the number this business gives it, so
// every sheet can be traced back to the purchase order it arrived on and the
// certificate that came with it. Backs the "Batches" overview.
export const Batches = mysqlTable(
  "Batches",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    purchaseOrderItemUuid: char("purchase_order_item_uuid", { length: 36 }),
    purchaseLineReceivalUuid: char("purchase_line_receival_uuid", {
      length: 36,
    }),
    stockUuid: char("stock_uuid", { length: 36 }),
    productUuid: char("product_uuid", { length: 36 }),
    supplierUuid: char("supplier_uuid", { length: 36 }),

    purchaseOrderCode: varchar("purchase_order_code", { length: 100 }),
    receiptDate: date("receipt_date", { mode: "string" }),

    // ── Physical attributes ───────────────────────────────────────────────────
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    qty: decimal("qty", { precision: 15, scale: 3 }).default("0.000"),
    unit: mysqlEnum("unit", stockUnits).default("st"),
    kg: decimal("kg", { precision: 15, scale: 2 }).default("0.00"),

    // ── Traceability ──────────────────────────────────────────────────────────
    // The mill's own heat number, and the number assigned here.
    charge: varchar("charge", { length: 100 }),
    internalCharge: varchar("internal_charge", { length: 100 }),
    sheetNumber: varchar("sheet_number", { length: 100 }),
    stockCategory: varchar("stock_category", { length: 100 }),
    qualityCode: varchar("quality_code", { length: 100 }),
    producer: varchar("producer", { length: 255 }),
    options: varchar("options", { length: 255 }),

    // ── Certificate ───────────────────────────────────────────────────────────
    documentCode: varchar("document_code", { length: 100 }),
    fileName: varchar("file_name", { length: 255 }),
    // "Mandatory, ignore document": the certificate is required, but this batch
    // is allowed to move on without the file being on hand.
    mandatoryIgnoreDocument: boolean("mandatory_ignore_document").default(
      false,
    ),
    documentCertificate: mysqlEnum("document_certificate", certificaatOptions),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_batches_purchase_order_uuid").on(table.purchaseOrderUuid),
    index("idx_batches_purchase_order_item_uuid").on(
      table.purchaseOrderItemUuid,
    ),
    index("idx_batches_purchase_line_receival_uuid").on(
      table.purchaseLineReceivalUuid,
    ),
    index("idx_batches_stock_uuid").on(table.stockUuid),
    index("idx_batches_product_uuid").on(table.productUuid),
    index("idx_batches_supplier_uuid").on(table.supplierUuid),
    index("idx_batches_receipt_date").on(table.receiptDate),
    foreignKey({
      name: "fk_batches_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_batches_purchase_order_item",
      columns: [table.purchaseOrderItemUuid],
      foreignColumns: [PurchaseOrderItems.uuid],
    }),
    foreignKey({
      name: "fk_batches_purchase_line_receival",
      columns: [table.purchaseLineReceivalUuid],
      foreignColumns: [PurchaseLineReceivals.uuid],
    }),
    foreignKey({
      name: "fk_batches_stock",
      columns: [table.stockUuid],
      foreignColumns: [Stock.uuid],
    }),
    foreignKey({
      name: "fk_batches_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_batches_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectBatches = InferSelectModel<typeof Batches>;
export type InsertBatches = InferInsertModel<typeof Batches>;
