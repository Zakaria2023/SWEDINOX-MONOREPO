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
} from "drizzle-orm/mysql-core";
import {
  complaintCategories,
  complaintReports,
  complaintTypes,
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
    qty: decimal("qty", { precision: 15, scale: 3 }).notNull().default("0.000"),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
    weight: decimal("weight", { precision: 15, scale: 3 }).notNull().default("0.000"),

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
