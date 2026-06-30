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
    orderUuid: char("order_uuid", { length: 36 }),
    quoteUuid: char("quote_uuid", { length: 36 }),
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    productGroupUuid: char("product_group_uuid", { length: 36 }),
    textCategoryUuid: char("text_category_uuid", { length: 36 }),

    title: varchar("title", { length: 255 }).notNull(),
    textBlock: text("text_block").notNull(),
    sequenceNumber: int("sequence_number").default(0),
    isActive: boolean("is_active").default(true),

    createdByUserId: varchar("created_by_user_id", { length: 255 }),

    visitReport: boolean("visit_report").default(false),
    purchaseQuoteRequest: boolean("purchase_quote_request").default(false),
    purchaseOrder: boolean("purchase_order").default(false),
    purchaseOrderToolTip: boolean("purchase_order_tool_tip").default(false),
    purchaseReturnOrder: boolean("purchase_return_order").default(false),
    salesQuote: boolean("sales_quote").default(false),
    salesOrder: boolean("sales_order").default(false),
    salesOrderToolTip: boolean("sales_order_tool_tip").default(false),
    salesInvoice: boolean("sales_invoice").default(false),
    warehouseOrder: boolean("warehouse_order").default(false),
    productionOrder: boolean("production_order").default(false),
    loadlist: boolean("loadlist").default(false),
    waybill: boolean("waybill").default(false),
    rideList: boolean("ride_list").default(false),
    customerLabel: boolean("customer_label").default(false),
    transportPlanning: boolean("transport_planning").default(false),
    websiteInAdvance: boolean("website_in_advance").default(false),
    websiteAfter: boolean("website_after").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_texts_company_uuid").on(table.companyUuid),
    index("idx_texts_order_uuid").on(table.orderUuid),
    index("idx_texts_quote_uuid").on(table.quoteUuid),
    index("idx_texts_purchase_order_uuid").on(table.purchaseOrderUuid),
    index("idx_texts_product_group_uuid").on(table.productGroupUuid),
    index("idx_texts_text_category_uuid").on(table.textCategoryUuid),
  ],
);

export type SelectTexts = InferSelectModel<typeof Texts>;
export type InsertTexts = InferInsertModel<typeof Texts>;
