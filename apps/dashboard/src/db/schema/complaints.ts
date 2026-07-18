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
} from "../../lib/enums";
import { Companies } from "./companies";
import { Contacts } from "./contacts";
import { Products } from "./products";

export const Complaints = mysqlTable(
  "Complaints",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contactUuid: char("contact_uuid", { length: 36 }),

    complaintType: mysqlEnum("complaint_type", complaintTypes),
    report: mysqlEnum("report", complaintReports),
    reportDate: date("report_date"),
    description: text("description"),
    category: mysqlEnum("category", complaintCategories),

    productUuid: char("product_uuid", { length: 36 }),
    qty: decimal("qty", { precision: 15, scale: 3 }).default("0.000"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    weight: decimal("weight", { precision: 15, scale: 3 }).default("0.000"),

    // ── Handling ──────────────────────────────────────────────────────────────
    status: mysqlEnum("status", complaintStatuses).default("new"),
    responsibleUserId: varchar("responsible_user_id", { length: 255 }),
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
    statusHistory:
      json("status_history").$type<
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
    index("idx_complaints_contact_uuid").on(table.contactUuid),
    index("idx_complaints_product_uuid").on(table.productUuid),
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
  ],
);

export type SelectComplaints = InferSelectModel<typeof Complaints>;
export type InsertComplaints = InferInsertModel<typeof Complaints>;
