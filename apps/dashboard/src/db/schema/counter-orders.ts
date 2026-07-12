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
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  counterOrderPriorities,
  counterOrderStatuses,
  deliveryTerms,
  deliveryTypes,
  orderMethods,
} from "@/lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";

export const CounterOrders = mysqlTable(
  "CounterOrders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ──────────────────────────────────────────────────────────────
    companyUuid: char("company_uuid", { length: 36 }).notNull(),
    contactUuid: char("contact_uuid", { length: 36 }),
    customerRef: varchar("customer_ref", { length: 255 }),
    leaveCustomer: boolean("leave_customer").default(false).notNull(),
    orderMethod: mysqlEnum("order_method", orderMethods),
    ourReference: varchar("our_reference", { length: 255 }),
    seller: varchar("seller", { length: 255 }),
    projectUuid: char("project_uuid", { length: 36 }),
    status: mysqlEnum("status", counterOrderStatuses)
      .default("open")
      .notNull(),
    priority: mysqlEnum("priority", counterOrderPriorities)
      .default("normal")
      .notNull(),
    priceDate: date("price_date", { mode: "string" }),
    orderDate: date("order_date", { mode: "string" }),
    handlingBlocked: boolean("handling_blocked").default(false).notNull(),
    printPickingSlips: boolean("print_picking_slips").default(true).notNull(),

    // ── Order type ──────────────────────────────────────────────────────────
    isPickup: boolean("is_pickup").default(false).notNull(),
    isIncidental: boolean("is_incidental").default(false).notNull(),
    isOverlengte: boolean("is_overlengte").default(false).notNull(),
    isPrinted: boolean("is_printed").default(false).notNull(),
    isMailed: boolean("is_mailed").default(false).notNull(),
    isFaxed: boolean("is_faxed").default(false).notNull(),

    // ── Delivery ────────────────────────────────────────────────────────────
    deliveryTerms: mysqlEnum("delivery_terms", deliveryTerms),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
    deliveryType: mysqlEnum("delivery_type", deliveryTypes).default("date"),
    deliveryDate: date("delivery_date", { mode: "string" }),
    deliveryWeek: int("delivery_week"),
    deliveryYear: int("delivery_year"),
    deliveryRemark: varchar("delivery_remark", { length: 255 }),

    // ── Summary ─────────────────────────────────────────────────────────────
    amountExVat: decimal("amount_ex_vat", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    weightKg: decimal("weight_kg", { precision: 12, scale: 3 })
      .default("0.000")
      .notNull(),
    gainPercent: decimal("gain_percent", { precision: 6, scale: 2 })
      .default("0.00")
      .notNull(),

    remarks: text("remarks"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_counter_orders_company_uuid").on(table.companyUuid),
    index("idx_counter_orders_contact_uuid").on(table.contactUuid),
    index("idx_counter_orders_project_uuid").on(table.projectUuid),
    index("idx_counter_orders_delivery_address_uuid").on(
      table.deliveryAddressUuid,
    ),
    foreignKey({
      name: "fk_counter_orders_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_counter_orders_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_counter_orders_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectCounterOrders = InferSelectModel<typeof CounterOrders>;
export type InsertCounterOrders = InferInsertModel<typeof CounterOrders>;
