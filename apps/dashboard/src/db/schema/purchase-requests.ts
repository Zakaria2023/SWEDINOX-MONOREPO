import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseOrderTypes,
} from "../../lib/enums";
import { Companies } from "./companies";
import { CompanyAddresses } from "./company-addresses";
import { Contacts } from "./contacts";

export const PurchaseRequests = mysqlTable(
  "PurchaseRequests",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // ── Header ────────────────────────────────────────────────────────────────
    supplierUuid: char("supplier_uuid", { length: 36 }),
    agentUuid: char("agent_uuid", { length: 36 }),
    contactUuid: char("contact_uuid", { length: 36 }),
    purchaser: varchar("purchaser", { length: 255 }),
    orderCategory: varchar("order_category", { length: 100 }),
    reference: varchar("reference", { length: 255 }),
    ourReference: varchar("our_reference", { length: 255 }),

    // ── Purchase order type ───────────────────────────────────────────────────
    purchaseOrderType: mysqlEnum("purchase_order_type", purchaseOrderTypes),
    weightType: mysqlEnum("weight_type", orderWeightTypes),
    isOverlengte: boolean("is_overlengte").default(false),
    isPrinted: boolean("is_printed").default(false),
    isMailed: boolean("is_mailed").default(false),
    isFaxed: boolean("is_faxed").default(false),
    messageSentViaStaalWeb: boolean("message_sent_via_staalweb").default(false),

    // ── Finances ──────────────────────────────────────────────────────────────
    paymentTerms: mysqlEnum("payment_terms", invoicePaymentTerms),

    // ── Delivery ──────────────────────────────────────────────────────────────
    deliveryTerms: mysqlEnum("delivery_terms", deliveryTerms),
    deliveryAddressUuid: char("delivery_address_uuid", { length: 36 }),
    arrangeTransport: boolean("arrange_transport").default(false),
    pickupDropoffCdPurchases: boolean("pickup_dropoff_cd_purchases").default(
      false,
    ),
    supplierAddressUuid: char("supplier_address_uuid", { length: 36 }),
    deliveryType: mysqlEnum("delivery_type", deliveryTypes).default("date"),
    deliveryDate: date("delivery_date"),
    deliveryWeek: int("delivery_week"),
    deliveryYear: int("delivery_year"),
    deliveryRemark: varchar("delivery_remark", { length: 255 }),

    // ── Follow-up ─────────────────────────────────────────────────────────────
    deadline: date("deadline"),

    // ── Documents ─────────────────────────────────────────────────────────────
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_requests_supplier_uuid").on(table.supplierUuid),
    index("idx_purchase_requests_agent_uuid").on(table.agentUuid),
    index("idx_purchase_requests_contact_uuid").on(table.contactUuid),
    index("idx_purchase_requests_delivery_address_uuid").on(
      table.deliveryAddressUuid,
    ),
    index("idx_purchase_requests_supplier_address_uuid").on(
      table.supplierAddressUuid,
    ),
    foreignKey({
      name: "fk_purchase_requests_supplier",
      columns: [table.supplierUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_requests_agent",
      columns: [table.agentUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_requests_contact",
      columns: [table.contactUuid],
      foreignColumns: [Contacts.uuid],
    }),
    foreignKey({
      name: "fk_purchase_requests_delivery_address",
      columns: [table.deliveryAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
    foreignKey({
      name: "fk_purchase_requests_supplier_address",
      columns: [table.supplierAddressUuid],
      foreignColumns: [CompanyAddresses.uuid],
    }),
  ],
);

export type SelectPurchaseRequests = InferSelectModel<typeof PurchaseRequests>;
export type InsertPurchaseRequests = InferInsertModel<typeof PurchaseRequests>;
