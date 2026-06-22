import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const Texts = mysqlTable(
  "Texts",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),
    productGroupUuid: char("product_group_uuid", { length: 36 }),
    textCategoryUuid: char("text_category_uuid", { length: 36 }),

    title: varchar("title", { length: 255 }).notNull(),
    textBlock: text("text_block").notNull(),
    sequenceNumber: int("sequence_number").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdByUserId: varchar("created_by_user_id", { length: 255 }),

    visitReport: boolean("visit_report").default(false).notNull(),
    purchaseQuoteRequest: boolean("purchase_quote_request").default(false).notNull(),
    purchaseOrder: boolean("purchase_order").default(false).notNull(),
    purchaseOrderToolTip: boolean("purchase_order_tool_tip").default(false).notNull(),
    purchaseReturnOrder: boolean("purchase_return_order").default(false).notNull(),
    salesQuote: boolean("sales_quote").default(false).notNull(),
    salesOrder: boolean("sales_order").default(false).notNull(),
    salesOrderToolTip: boolean("sales_order_tool_tip").default(false).notNull(),
    salesInvoice: boolean("sales_invoice").default(false).notNull(),
    warehouseOrder: boolean("warehouse_order").default(false).notNull(),
    productionOrder: boolean("production_order").default(false).notNull(),
    loadlist: boolean("loadlist").default(false).notNull(),
    waybill: boolean("waybill").default(false).notNull(),
    rideList: boolean("ride_list").default(false).notNull(),
    customerLabel: boolean("customer_label").default(false).notNull(),
    transportPlanning: boolean("transport_planning").default(false).notNull(),
    websiteInAdvance: boolean("website_in_advance").default(false).notNull(),
    websiteAfter: boolean("website_after").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_texts_company_uuid").on(table.companyUuid),
    index("idx_texts_product_group_uuid").on(table.productGroupUuid),
    index("idx_texts_text_category_uuid").on(table.textCategoryUuid),
  ],
);

export type SelectTexts = InferSelectModel<typeof Texts>;
export type InsertTexts = InferInsertModel<typeof Texts>;
