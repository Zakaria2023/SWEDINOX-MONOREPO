import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
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
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  purchaseInvoiceBlockReasons,
  purchaseInvoiceFiscalBases,
} from "../../lib/enums";
import { Companies } from "./companies";
import { Contacts } from "./contacts";

export const PurchaseInvoices = mysqlTable(
  "PurchaseInvoices",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    companyUuid: char("company_uuid", { length: 36 }),
    invoiceSentByContactUuid: char("invoice_sent_by_contact_uuid", {
      length: 36,
    }),

    bookingDate: date("booking_date"),
    invoiceDate: date("invoice_date"),
    expirationDate: date("expiration_date"),

    invoiceNumberSupplier: varchar("invoice_number_supplier", { length: 100 }),
    creditorNo: varchar("creditor_no", { length: 100 }),
    creditorNo2: varchar("creditor_no_2", { length: 100 }),

    basisForFiscalPeriod: mysqlEnum(
      "basis_for_fiscal_period",
      purchaseInvoiceFiscalBases,
    ).default("booking_date"),
    invoiceTotal: decimal("invoice_total", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    purchaseOrderNumber: varchar("purchase_order_number", { length: 100 }),

    paymentTerms: mysqlEnum("pi_payment_terms", invoicePaymentTerms),
    blocked: boolean("blocked").default(false),
    blockReason: mysqlEnum("block_reason", purchaseInvoiceBlockReasons),

    materials: decimal("materials", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    optionsAmount: decimal("options_amount", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    surcharges: decimal("surcharges", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    vatHigh: decimal("vat_high", { precision: 15, scale: 2 }).default("0.00"),
    vatMiddle: decimal("vat_middle", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    vatLow: decimal("vat_low", { precision: 15, scale: 2 }).default("0.00"),
    creditRestriction: decimal("credit_restriction", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    remarks: text("remarks"),
    documents:
      json("documents").$type<Array<{ id: string; fileName: string }>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_invoices_company_uuid").on(table.companyUuid),
    index("idx_purchase_invoices_contact_uuid").on(
      table.invoiceSentByContactUuid,
    ),
    foreignKey({
      name: "fk_purchase_invoices_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
    foreignKey({
      name: "fk_purchase_invoices_contact",
      columns: [table.invoiceSentByContactUuid],
      foreignColumns: [Contacts.uuid],
    }),
  ],
);

export type SelectPurchaseInvoices = InferSelectModel<typeof PurchaseInvoices>;
export type InsertPurchaseInvoices = InferInsertModel<typeof PurchaseInvoices>;

export const PurchaseInvoiceSurcharges = mysqlTable(
  "PurchaseInvoiceSurcharges",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    purchaseInvoiceUuid: char("purchase_invoice_uuid", { length: 36 }),

    order: int("order").default(0),
    booked: boolean("booked").default(false),
    orderRef: varchar("order_ref", { length: 100 }),
    description: mysqlEnum("description", invoiceSurchargeDescriptions),
    revenueGroup: varchar("revenue_group", { length: 100 }),
    surcharge: decimal("surcharge", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    unit: varchar("unit", { length: 50 }),
    surchargeBasis: decimal("surcharge_basis", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
    vatRate: decimal("vat_rate", { precision: 5, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_purchase_invoice_surcharges_purchase_invoice_uuid").on(
      table.purchaseInvoiceUuid,
    ),
    foreignKey({
      name: "fk_purchase_invoice_surcharges_purchase_invoice",
      columns: [table.purchaseInvoiceUuid],
      foreignColumns: [PurchaseInvoices.uuid],
    }),
  ],
);

export type SelectPurchaseInvoiceSurcharges = InferSelectModel<
  typeof PurchaseInvoiceSurcharges
>;
export type InsertPurchaseInvoiceSurcharges = InferInsertModel<
  typeof PurchaseInvoiceSurcharges
>;
