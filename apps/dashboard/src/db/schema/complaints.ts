import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  date,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  complaintCategories,
  complaintCauses,
  complaintReports,
  complaintSolutions,
  complaintStatuses,
  complaintTypes,
  ComplaintStatus,
  stockUnits,
} from "../../lib/enums";
import { Companies } from "./companies";
import { Contacts } from "./contacts";
import { CounterOrders } from "./counter-orders";
import { Orders } from "./orders";
import { Products } from "./products";
import { PurchaseOrders } from "./purchase-orders";
import { PurchaseQuotes } from "./purchase-quotes";
import { Quotes } from "./quotes";
import { ReturnOrders } from "./return-orders";

export const Complaints = mysqlTable(
  "Complaints",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contactUuid: char("contact_uuid", { length: 36 }),

    complaintType: mysqlEnum("complaint_type", complaintTypes),
    // The document the complaint is about. The reference shows one `Order:`
    // picker beside the type, and the type decides what it picks: an `Order`
    // complaint names a sales order (58 of 58 in its export), a
    // `Purchase order` complaint a purchase order (2 of 2); a `General` one
    // names nothing. One column per document kind keeps each a real foreign
    // key; only the one the type calls for is ever set.
    orderUuid: char("order_uuid", { length: 36 }),
    quoteUuid: char("quote_uuid", { length: 36 }),
    counterOrderUuid: char("counter_order_uuid", { length: 36 }),
    purchaseOrderUuid: char("purchase_order_uuid", { length: 36 }),
    purchaseQuoteUuid: char("purchase_quote_uuid", { length: 36 }),
    returnOrderUuid: char("return_order_uuid", { length: 36 }),
    report: mysqlEnum("report", complaintReports),
    reportDate: date("report_date"),
    description: text("description"),
    category: mysqlEnum("category", complaintCategories),

    productUuid: char("product_uuid", { length: 36 }),
    qty: decimal("qty", { precision: 15, scale: 3 }).default("0.000"),
    // The unit the quantity is in — a dropdown beside `Qty` on the reference.
    qtyUnit: mysqlEnum("qty_unit", stockUnits),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    weight: decimal("weight", { precision: 15, scale: 3 }).default("0.000"),

    // ── Handling ──────────────────────────────────────────────────────────────
    status: mysqlEnum("status", complaintStatuses).default("new"),
    responsibleUserId: varchar("responsible_user_id", { length: 255 }),
    // "Recorded by … on …; last changed by … on …" heads the reference's
    // record, and `Captured by` is a column of both overviews.
    createdByUserId: varchar("created_by_user_id", { length: 255 }),
    modifiedByUserId: varchar("modified_by_user_id", { length: 255 }),
    deadline: date("deadline", { mode: "string" }),
    cause: mysqlEnum("cause", complaintCauses),
    explanationOfCause: text("explanation_of_cause"),
    solution: mysqlEnum("solution", complaintSolutions),
    explanationOfSolution: text("explanation_of_solution"),

    // ── Handling costs ──────────────────────────────────────────────────────────
    costsCustomer: decimal("costs_customer", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    costsCustomerNote: varchar("costs_customer_note", { length: 255 }),
    internalCosts: decimal("internal_costs", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    internalCostsNote: varchar("internal_costs_note", { length: 255 }),
    extraCosts: decimal("extra_costs", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    extraCostsNote: varchar("extra_costs_note", { length: 255 }),
    toBeReclaimed: decimal("to_be_reclaimed", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    toBeReclaimedNote: varchar("to_be_reclaimed_note", { length: 255 }),

    // Snapshot of every status change; `assignedBy*` records who made it.
    statusHistory: json("status_history").$type<
      Array<{
        status: ComplaintStatus;
        statusDate: string;
        assignedByUserId: string;
        assignedByName: string;
      }>
    >(),
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_complaints_company_uuid").on(table.companyUuid),
    // A complaint list is worked by state and by when it came in.
    index("idx_complaints_status").on(table.status),
    index("idx_complaints_report_date").on(table.reportDate),
    index("idx_complaints_created_at_id").on(table.createdAt, table.id),
    index("idx_complaints_contact_uuid").on(table.contactUuid),
    index("idx_complaints_product_uuid").on(table.productUuid),
    index("idx_complaints_order_uuid").on(table.orderUuid),
    index("idx_complaints_purchase_order_uuid").on(table.purchaseOrderUuid),
    index("idx_complaints_return_order_uuid").on(table.returnOrderUuid),
    foreignKey({
      name: "fk_complaints_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_complaints_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_complaints_product",
      columns: [table.productUuid],
      foreignColumns: [Products.uuid],
    }),
    foreignKey({
      name: "fk_complaints_order",
      columns: [table.orderUuid],
      foreignColumns: [Orders.uuid],
    }),
    foreignKey({
      name: "fk_complaints_quote",
      columns: [table.quoteUuid],
      foreignColumns: [Quotes.uuid],
    }),
    foreignKey({
      name: "fk_complaints_counter_order",
      columns: [table.counterOrderUuid],
      foreignColumns: [CounterOrders.uuid],
    }),
    foreignKey({
      name: "fk_complaints_purchase_order",
      columns: [table.purchaseOrderUuid],
      foreignColumns: [PurchaseOrders.uuid],
    }),
    foreignKey({
      name: "fk_complaints_purchase_quote",
      columns: [table.purchaseQuoteUuid],
      foreignColumns: [PurchaseQuotes.uuid],
    }),
    foreignKey({
      name: "fk_complaints_return_order",
      columns: [table.returnOrderUuid],
      foreignColumns: [ReturnOrders.uuid],
    }),
  ],
);

export type SelectComplaints = InferSelectModel<typeof Complaints>;
export type InsertComplaints = InferInsertModel<typeof Complaints>;
