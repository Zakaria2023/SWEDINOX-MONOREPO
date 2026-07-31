import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { reminderStages } from "../../lib/enums";
import { Companies } from "./companies";
import { Invoices } from "./invoices";

// One row per reminder actually sent. The invoice deliberately carries no
// "reminder stage" column: the trail is the state, so the two can never
// disagree about whether a customer was chased.
//
// What was owed and how late it was at the time are copied in, because both
// move afterwards. A reminder that says "€ 4,000, 44 days overdue" has to keep
// saying that after the customer pays half of it — otherwise the record of what
// was sent silently rewrites itself.
export const InvoiceReminders = mysqlTable(
  "InvoiceReminders",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    invoiceUuid: char("invoice_uuid", { length: 36 }).notNull(),
    companyUuid: char("company_uuid", { length: 36 }),

    stage: mysqlEnum("stage", reminderStages).notNull(),

    outstandingAtSend: decimal("outstanding_at_send", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    daysOverdueAtSend: int("days_overdue_at_send").default(0).notNull(),

    // How many addresses it reached. Zero is recorded rather than suppressed: a
    // reminder nobody could be sent to is exactly what a credit controller
    // needs to see, and hiding the attempt would have the screen offer to send
    // it again forever.
    recipientCount: int("recipient_count").default(0).notNull(),

    sentByUserId: varchar("sent_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_invoice_reminders_invoice_uuid").on(table.invoiceUuid),
    index("idx_invoice_reminders_company_uuid").on(table.companyUuid),
    // Each stage goes out once per invoice. Enforced here rather than checked in
    // the action, because two credit controllers working the same list is
    // exactly the case a check-then-insert loses — and the customer receives
    // the same letter twice.
    unique("uq_invoice_reminders_invoice_stage").on(
      table.invoiceUuid,
      table.stage,
    ),
    foreignKey({
      name: "fk_invoice_reminders_invoice",
      columns: [table.invoiceUuid],
      foreignColumns: [Invoices.uuid],
    }),
    foreignKey({
      name: "fk_invoice_reminders_company",
      columns: [table.companyUuid],
      foreignColumns: [Companies.uuid],
    }),
  ],
);

export type SelectInvoiceReminders = InferSelectModel<typeof InvoiceReminders>;
export type InsertInvoiceReminders = InferInsertModel<typeof InvoiceReminders>;
