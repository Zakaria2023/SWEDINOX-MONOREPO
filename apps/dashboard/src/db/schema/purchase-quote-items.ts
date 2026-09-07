import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
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
import { orderLineStatuses, stockUnits } from "../../lib/enums";
import { Products } from "./products";
import { PurchaseQuotes } from "./purchase-quotes";
import { RevenueGroups } from "./revenue-groups";

// Line items of a purchase quote ("Purchase quotes" overview shows one row per
// quote line).
export const PurchaseQuoteItems = mysqlTable(
  "PurchaseQuoteItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseQuoteUuid: char("purchase_quote_uuid", { length: 36 }).notNull(),
    productUuid: char("product_uuid", { length: 36 }),
    revenueGroupUuid: char("revenue_group_uuid", { length: 36 }),

    lineNumber: int("line_number"),
    status: mysqlEnum("status", orderLineStatuses).default("in_progress"),
    expirationReason: varchar("expiration_reason", { length: 255 }),
    description: varchar("description", { length: 255 }),

    // ── Physical attributes ───────────────────────────────────────────────────
    lengthMm: int("length_mm"),
    widthMm: int("width_mm"),
    thicknessMm: decimal("thickness_mm", { precision: 10, scale: 2 }),
    quantity: decimal("quantity", { precision: 15, scale: 3 }).default("0.000"),
    unit: mysqlEnum("unit", stockUnits).default("st"),
    kg: decimal("kg", { precision: 15, scale: 2 }).default("0.00"),

    // ── Pricing ───────────────────────────────────────────────────────────────
    // What the supplier quoted before discounts, and the two percentages that
    // come off it — the group's, then the line's. The reference shows all four
    // side by side on a quote line, with net as the result rather than a
    // separate figure somebody types.
    grossPrice: decimal("gross_price", { precision: 15, scale: 4 }).default(
      "0.0000",
    ),
    groupDiscountPercent: decimal("group_discount_percent", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    lineDiscountPercent: decimal("line_discount_percent", {
      precision: 6,
      scale: 2,
    }).default("0.00"),
    netPrice: decimal("net_price", { precision: 15, scale: 2 }).default("0.00"),
    priceUnit: varchar("price_unit", { length: 10 }),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),

    // ── References ────────────────────────────────────────────────────────────
    companyCode: varchar("company_code", { length: 100 }),
    internalText: text("internal_text"),
    isConsignment: boolean("is_consignment").default(false),
    purchaser: varchar("purchaser", { length: 255 }),
    purchaserInitials: varchar("purchaser_initials", { length: 50 }),
    ourReference: varchar("our_reference", { length: 255 }),
    purchaseReference: varchar("purchase_reference", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_quote_items_purchase_quote_uuid").on(
      table.purchaseQuoteUuid,
    ),
    index("idx_purchase_quote_items_product_uuid").on(table.productUuid),
    index("idx_purchase_quote_items_revenue_group_uuid").on(
      table.revenueGroupUuid,
    ),
    foreignKey({
      name: "fk_purchase_quote_items_purchase_quote",
      columns: [table.purchaseQuoteUuid],
      foreignColumns: [PurchaseQuotes.uuid],
    }),
    foreignKey({
      name: "fk_purchase_quote_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_purchase_quote_items_revenue_group",
      columns: [table.revenueGroupUuid],
      foreignColumns: [RevenueGroups.uuid],
    }),
  ],
);

export type SelectPurchaseQuoteItems = InferSelectModel<
  typeof PurchaseQuoteItems
>;
export type InsertPurchaseQuoteItems = InferInsertModel<
  typeof PurchaseQuoteItems
>;
