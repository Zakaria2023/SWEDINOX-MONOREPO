import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  mysqlEnum,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { complaintCategories, complaintTypes } from "../../lib/enums";
import { Complaints } from "./complaints";
import { OrderItems } from "./order-items";
import { Orders } from "./orders";
import { Products } from "./products";
import { Warehouses } from "./warehouses";

// One complained-about line of a complaint: which delivered goods, how many,
// from where. Backs the "Complaint lines" overview.
//
// The handling — status, cause, solution, deadline, who is responsible — is
// the complaint's, not the line's. The reference keeps it in its own
// `COMPLAINT_HANDLING` table on the complaint and gives `COMPLAINT_LINE` only
// the delivery facts and a `COMPLETED` tick. Lines used to repeat the
// complaint's handling and could disagree with it; those columns were dropped
// on 15-9-2026, and every line now shows its complaint's handling.
export const ComplaintItems = mysqlTable(
  "ComplaintItems",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    complaintUuid: char("complaint_uuid", { length: 36 }).notNull(),
    orderUuid: char("order_uuid", { length: 36 }),
    orderItemUuid: char("order_item_uuid", { length: 36 }),
    productUuid: char("product_uuid", { length: 36 }),
    // The section the goods were stored in when the complaint was raised.
    warehouseSectionUuid: char("warehouse_section_uuid", { length: 36 }),

    lineNumber: int("line_number"),
    description: text("description"),
    category: mysqlEnum("category", complaintCategories),
    complaintType: mysqlEnum("complaint_type", complaintTypes),

    // When the complained-about goods were delivered — the reference's
    // `COMPLAINT_LINE.DELIVERYDATE`, taken from the order line.
    deliveryDate: date("delivery_date", { mode: "string" }),
    // This line is dealt with, whatever the complaint as a whole still waits
    // on — the reference's `COMPLAINT_LINE.COMPLETED`.
    completed: boolean("completed").default(false).notNull(),

    // ── People (Clerk user ids / free text names) ─────────────────────────────
    createdByUserId: varchar("created_by_user_id", { length: 255 }),
    // The buyer or seller the line belongs to, copied from the order.
    purchaserSeller: varchar("purchaser_seller", { length: 255 }),
    correspondenceName: varchar("correspondence_name", { length: 255 }),

    // ── Quantities ────────────────────────────────────────────────────────────
    qty: decimal("qty", { precision: 15, scale: 3 }).default("0.000"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    weightKg: decimal("weight_kg", { precision: 15, scale: 2 }).default("0.00"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_complaint_items_complaint_uuid").on(table.complaintUuid),
    index("idx_complaint_items_order_uuid").on(table.orderUuid),
    index("idx_complaint_items_order_item_uuid").on(table.orderItemUuid),
    index("idx_complaint_items_product_uuid").on(table.productUuid),
    index("idx_complaint_items_warehouse_section_uuid").on(
      table.warehouseSectionUuid,
    ),
    foreignKey({
      name: "fk_complaint_items_complaint",
      columns: [table.complaintUuid],
      foreignColumns: [Complaints.uuid],
    }),
    foreignKey({
      name: "fk_complaint_items_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_complaint_items_order_item",
      columns: [table.orderItemUuid],
      foreignColumns: [OrderItems.uuid],
    }),
    foreignKey({
      name: "fk_complaint_items_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_complaint_items_warehouse_section",
      columns: [table.warehouseSectionUuid],
      foreignColumns: [Warehouses.uuid],
    }),
  ],
);

export type SelectComplaintItems = InferSelectModel<typeof ComplaintItems>;
export type InsertComplaintItems = InferInsertModel<typeof ComplaintItems>;
