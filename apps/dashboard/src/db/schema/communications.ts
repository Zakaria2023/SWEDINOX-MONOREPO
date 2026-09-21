import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { communicationChannels } from "../../lib/enums";

/**
 * Every document this system has sent to somebody outside it.
 *
 * ⚠️ **The shape here is ours, not the reference's.** Its sales order carries a
 * `Communication` panel and all that was captured on 21-9-2026 is the name —
 * no columns, no rows. So this is not a reconstruction of that panel and should
 * not be read as one; it is built to the gap it fills, and will need
 * reconciling against the real thing once somebody opens it.
 *
 * 🔴 The gap is real on its own terms. `emails/documents.ts` sends order
 * confirmations, delivery notes and invoices, and on failure writes
 * `console.error` and returns — so a confirmation that never reached the
 * customer leaves no trace anybody will ever look at, and "did we send it?"
 * has no answer. That is worth fixing whether or not it matches the panel.
 *
 * The document is named by type and uuid rather than by a column per kind: an
 * order, an invoice, a delivery note and a purchase order can all be sent, and
 * eight nullable foreign keys to say which would be worse than two columns that
 * say it plainly.
 */
export const Communications = mysqlTable(
  "Communications",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    /** `order`, `invoice`, `delivery`, `purchase_order`, … */
    documentType: varchar("document_type", { length: 50 }).notNull(),
    documentUuid: char("document_uuid", { length: 36 }),
    /** Printed on the panel, so a deleted document still reads sensibly. */
    documentLabel: varchar("document_label", { length: 255 }),

    /** Who it went to. Null for a send with no company behind it. */
    companyUuid: char("company_uuid", { length: 36 }),

    channel: mysqlEnum("channel", communicationChannels)
      .notNull()
      .default("email"),
    /** The address, number or account it was sent to. */
    recipient: varchar("recipient", { length: 500 }),
    subject: varchar("subject", { length: 500 }),

    sentAt: timestamp("sent_at").defaultNow().notNull(),
    /**
     * How many recipients took it and how many refused. A send to three
     * contacts where one bounces is neither a success nor a failure, and the
     * panel has to be able to say so.
     */
    deliveredCount: int("delivered_count").notNull().default(0),
    failedCount: int("failed_count").notNull().default(0),
    /** Why it failed, when it did. The thing `console.error` was throwing away. */
    failureReason: text("failure_reason"),

    /** The Clerk user id of whoever pressed send. Null for a batch. */
    sentByUserId: varchar("sent_by_user_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // The panel reads one document's history; the company view reads one
    // customer's. Both are the whole point of the table.
    index("idx_communications_document").on(
      table.documentType,
      table.documentUuid,
    ),
    index("idx_communications_company_uuid").on(table.companyUuid),
    index("idx_communications_sent_at").on(table.sentAt),
  ],
);

export type SelectCommunications = InferSelectModel<typeof Communications>;
export type InsertCommunications = InferInsertModel<typeof Communications>;
