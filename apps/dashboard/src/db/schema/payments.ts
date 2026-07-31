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
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { paymentMethods } from "../../lib/enums";
import { Companies } from "./companies";
import { Invoices } from "./invoices";
import { PurchaseInvoices } from "./purchase-invoices";

// Money settled against an invoice — received from a customer, or paid to a
// supplier. Until this existed nothing could reduce an invoice's outstanding
// balance, so every invoice stayed open forever and the receivables screens
// showed a debt that could never be cleared.
//
// A payment is never edited. Getting one wrong is corrected by reversing it and
// registering the right one, so the trail keeps what was booked and when.
export const Payments = mysqlTable(
  "Payments",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // Exactly one of these is set: a receipt against a sales invoice, or a
    // payment against a purchase invoice.
    invoiceUuid: char("invoice_uuid", { length: 36 }),
    purchaseInvoiceUuid: char("purchase_invoice_uuid", { length: 36 }),
    companyUuid: char("company_uuid", { length: 36 }),

    paymentDate: date("payment_date", { mode: "string" }).notNull(),

    // What actually moved.
    amount: decimal("amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    // What the payer was entitled to keep for paying early. It settles the
    // invoice alongside the cash, so an invoice can close in full even though
    // less money arrived than was billed. Held separately because it is a cost
    // of granting credit, not a shortfall.
    discountAmount: decimal("discount_amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),

    method: mysqlEnum("method", paymentMethods).default("bank_transfer"),
    reference: varchar("reference", { length: 255 }),

    // Reversed rather than deleted — see the note above.
    reversed: boolean("reversed").default(false).notNull(),
    reversedAt: timestamp("reversed_at"),

    createdByUserId: varchar("created_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_payments_invoice_uuid").on(table.invoiceUuid),
    index("idx_payments_purchase_invoice_uuid").on(table.purchaseInvoiceUuid),
    index("idx_payments_company_uuid").on(table.companyUuid),
    index("idx_payments_payment_date").on(table.paymentDate),
    foreignKey({
      name: "fk_payments_invoice",
      columns: [table.invoiceUuid],
      foreignColumns: [Invoices.uuid],
    }),
    foreignKey({
      name: "fk_payments_purchase_invoice",
      columns: [table.purchaseInvoiceUuid],
      foreignColumns: [PurchaseInvoices.uuid],
    }),
    foreignKey({
      name: "fk_payments_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectPayments = InferSelectModel<typeof Payments>;
export type InsertPayments = InferInsertModel<typeof Payments>;
