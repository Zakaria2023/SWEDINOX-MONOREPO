import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { InvoiceReminders } from "@/db/schema/invoice-reminders";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { ReminderStage } from "@/lib/enums";

/**
 * One open item on the sales ledger, with whatever chasing has already been
 * done attached to it.
 *
 * There is exactly one definition of "open" in the system and this is it, so
 * the ageing report and the reminder run can never disagree about which
 * invoices are outstanding:
 *
 *   - a cancelled invoice is void, so nothing is owed on it;
 *   - a zero balance is settled, whether by payment, discount or credit;
 *   - a non-zero balance is open, including a negative one. A credit note the
 *     customer has not yet taken against an invoice is money we owe them, and
 *     leaving it out would overstate the debt.
 */
export type OpenReceivable = {
  invoiceUuid: SelectInvoices["uuid"];
  invoiceId: SelectInvoices["id"];
  documentType: SelectInvoices["documentType"];
  companyUuid: SelectInvoices["companyUuid"];
  companyName: SelectCompanies["companyName"] | null;
  debtorNo: SelectInvoices["debtorNo"];
  representative: SelectCompanies["representative"] | null;
  invoiceDate: SelectInvoices["invoiceDate"];
  dueDate: SelectInvoices["expirationDate"];
  paymentTerms: SelectInvoices["paymentTerms"];
  invoiceTotal: number;
  outstanding: number;
  /** The debtor's own `reminder` flag: whether they are chased at all. */
  remindersEnabled: NonNullable<SelectCompanies["reminder"]>;
  /** The last reminder actually sent, and when. Null when none has been. */
  lastStageSent: ReminderStage | null;
  lastRemindedAt: Date | null;
  remindersSent: number;
};

const openReceivableQuery = (invoiceUuid?: string) => {
  // The newest reminder per invoice, and how many have gone out. Reached in two
  // steps because the row carrying the latest stage is found by its id, not by
  // aggregating it.
  const latestReminderId = db
    .select({
      invoiceUuid: InvoiceReminders.invoiceUuid,
      maxId: sql<number>`MAX(${InvoiceReminders.id})`.as("max_id"),
      sentCount: sql<number>`COUNT(*)`.as("sent_count"),
    })
    .from(InvoiceReminders)
    .groupBy(InvoiceReminders.invoiceUuid)
    .as("latest_reminder_id");

  const latestReminder = db
    .select({
      invoiceUuid: InvoiceReminders.invoiceUuid,
      stage: InvoiceReminders.stage,
      sentAt: InvoiceReminders.createdAt,
      sentCount: latestReminderId.sentCount,
    })
    .from(InvoiceReminders)
    .innerJoin(latestReminderId, eq(InvoiceReminders.id, latestReminderId.maxId))
    .as("latest_reminder");

  return db
    .select({
      invoiceUuid: Invoices.uuid,
      invoiceId: Invoices.id,
      documentType: Invoices.documentType,
      companyUuid: Invoices.companyUuid,
      companyName: Companies.companyName,
      debtorNo: Invoices.debtorNo,
      representative: Companies.representative,
      invoiceDate: Invoices.invoiceDate,
      dueDate: Invoices.expirationDate,
      paymentTerms: Invoices.paymentTerms,
      invoiceTotal: Invoices.invoiceTotal,
      outstanding: Invoices.outstanding,
      reminder: Companies.reminder,
      lastStageSent: latestReminder.stage,
      lastRemindedAt: latestReminder.sentAt,
      remindersSent: latestReminder.sentCount,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .leftJoin(latestReminder, eq(Invoices.uuid, latestReminder.invoiceUuid))
    .where(
      and(
        eq(Invoices.cancelled, false),
        ne(Invoices.outstanding, "0.00"),
        invoiceUuid ? eq(Invoices.uuid, invoiceUuid) : undefined,
      ),
    )
    // Oldest debt first: the top of this list is the money that has been owed
    // longest, which is the order a credit controller works in.
    .orderBy(sql`${Invoices.expirationDate} asc, ${Invoices.id} asc`);
};

type OpenReceivableRow = Awaited<
  ReturnType<typeof openReceivableQuery>
>[number];

const toOpenReceivable = (row: OpenReceivableRow): OpenReceivable => ({
  invoiceUuid: row.invoiceUuid,
  invoiceId: row.invoiceId,
  documentType: row.documentType,
  companyUuid: row.companyUuid,
  companyName: row.companyName ?? null,
  debtorNo: row.debtorNo,
  representative: row.representative ?? null,
  invoiceDate: row.invoiceDate,
  dueDate: row.dueDate,
  paymentTerms: row.paymentTerms,
  invoiceTotal: Number(row.invoiceTotal ?? 0),
  outstanding: Number(row.outstanding ?? 0),
  // A debtor nobody has set the flag on is chased. The column defaults to
  // true, and a blank means "not configured", not "leave them alone".
  remindersEnabled: row.reminder ?? true,
  lastStageSent: row.lastStageSent ?? null,
  lastRemindedAt: row.lastRemindedAt ?? null,
  remindersSent: Number(row.remindersSent ?? 0),
});

export const getOpenReceivableItems = async (): Promise<OpenReceivable[]> =>
  (await openReceivableQuery()).map(toOpenReceivable);

/**
 * One open item, read fresh.
 *
 * Returns `null` when the invoice is no longer open — cancelled, or settled
 * since the screen was drawn. An action that is about to write to a customer
 * has to work from this rather than from what the page was rendered with.
 */
export const getOpenReceivableItem = async (
  invoiceUuid: string,
): Promise<OpenReceivable | null> => {
  const [row] = await openReceivableQuery(invoiceUuid);
  return row ? toOpenReceivable(row) : null;
};
