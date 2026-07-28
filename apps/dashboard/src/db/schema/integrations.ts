import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { Companies } from "./companies";

// ── Imported purchase invoices ──────────────────────────────────────────────
// The inbound message log for supplier invoices that arrive electronically.
// One row per message, not per invoice: a message that failed to process still
// has to be visible, and it has no invoice behind it to hang off.
//
// Status, role and destination are free text rather than enums because they are
// the sending system's vocabulary, not ours — pinning them to an enum would
// mean a new supplier's message could not be logged at all.
export const ImportedPurchaseInvoices = mysqlTable(
  "ImportedPurchaseInvoices",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    supplierUuid: char("supplier_uuid", { length: 36 }),

    adjustedAt: timestamp("adjusted_at"),
    // Clerk user id of whoever last touched the message by hand.
    adjustedByUserId: varchar("adjusted_by_user_id", { length: 255 }),

    finalDestination: varchar("final_destination", { length: 255 }),
    specification: varchar("specification", { length: 255 }),
    invoiceStatus: varchar("invoice_status", { length: 100 }),
    role: varchar("role", { length: 100 }),
    invoiceNumber: varchar("invoice_number", { length: 100 }),
    workPanel: varchar("work_panel", { length: 255 }),

    // Where the raw payloads were parked, and the payloads themselves. Kept so
    // a failed message can be re-read exactly as it arrived.
    receiveDataStorage: varchar("receive_data_storage", { length: 255 }),
    receiveData: text("receive_data"),
    dataSentStorage: varchar("data_sent_storage", { length: 255 }),
    dataSent: text("data_sent"),

    invokedMethod: varchar("invoked_method", { length: 255 }),
    retryPossible: boolean("retry_possible").default(false),
    lastErrorMessage: text("last_error_message"),
    errorMessage: text("error_message"),
    userInteractionRequired: boolean("user_interaction_required").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_imported_purchase_invoices_supplier_uuid").on(table.supplierUuid),
    index("idx_imported_purchase_invoices_created_at").on(table.createdAt),
    foreignKey({
      name: "fk_imported_purchase_invoices_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

// ── SigmaNest blocked orders ────────────────────────────────────────────────
// Work orders the SigmaNest nesting software has refused to release, with the
// documents on either side of them so the block can be chased down without
// leaving the overview. The references are stored as the codes SigmaNest
// reports rather than as foreign keys: the block often exists precisely because
// one of them does not resolve.
export const SigmaNestBlockedOrders = mysqlTable(
  "SigmaNestBlockedOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    workOrder: varchar("work_order", { length: 100 }).notNull(),
    customerUuid: char("customer_uuid", { length: 36 }),
    customerName: varchar("customer_name", { length: 255 }),
    deliveryDate: date("delivery_date", { mode: "string" }),
    purchaseOrderCode: varchar("purchase_order_code", { length: 100 }),
    salesOrderCode: varchar("sales_order_code", { length: 100 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_sigmanest_blocked_orders_work_order").on(table.workOrder),
    index("idx_sigmanest_blocked_orders_customer_uuid").on(table.customerUuid),
    foreignKey({
      name: "fk_sigmanest_blocked_orders_customer",
      columns: [table.customerUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectImportedPurchaseInvoices = InferSelectModel<
  typeof ImportedPurchaseInvoices
>;
export type InsertImportedPurchaseInvoices = InferInsertModel<
  typeof ImportedPurchaseInvoices
>;
export type SelectSigmaNestBlockedOrders = InferSelectModel<
  typeof SigmaNestBlockedOrders
>;
export type InsertSigmaNestBlockedOrders = InferInsertModel<
  typeof SigmaNestBlockedOrders
>;
