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
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { stockUnits } from "../../lib/enums";
import { Products } from "./products";
import { PurchaseRequests } from "./purchase-requests";

// What a purchase request is asking suppliers to quote for.
//
// These lines deliberately carry no price. A request is the question — "who can
// supply this, and for how much?" — so a price here would be answering it. The
// answer lives on PurchaseQuoteItems, one set per supplier asked, and the
// awarded set is what becomes the purchase order.
export const PurchaseRequestItems = mysqlTable(
  "PurchaseRequestItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseRequestUuid: char("purchase_request_uuid", {
      length: 36,
    }).notNull(),
    // Nullable: a request may ask for something not yet on the product list —
    // that is a normal way for a new product to enter the system.
    productUuid: char("product_uuid", { length: 36 }),

    lineNumber: int("line_number"),
    description: varchar("description", { length: 255 }),

    // ── Physical attributes ───────────────────────────────────────────────────
    quantity: decimal("quantity", { precision: 15, scale: 3 }).default("0.000"),
    unit: mysqlEnum("unit", stockUnits).default("st"),
    kg: decimal("kg", { precision: 15, scale: 2 }).default("0.00"),
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    qualityCode: varchar("quality_code", { length: 100 }),

    // ── Requirement ───────────────────────────────────────────────────────────
    requiredDate: date("required_date", { mode: "string" }),
    remark: text("remark"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_request_items_purchase_request_uuid").on(
      table.purchaseRequestUuid,
    ),
    index("idx_purchase_request_items_product_uuid").on(table.productUuid),
    foreignKey({
      name: "fk_purchase_request_items_purchase_request",
      columns: [table.purchaseRequestUuid],
      foreignColumns: [PurchaseRequests.uuid],
    }),
    foreignKey({
      name: "fk_purchase_request_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
  ],
);

export type SelectPurchaseRequestItems = InferSelectModel<
  typeof PurchaseRequestItems
>;
export type InsertPurchaseRequestItems = InferInsertModel<
  typeof PurchaseRequestItems
>;
