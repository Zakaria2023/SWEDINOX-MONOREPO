"use server";

import { db } from "@/db";
import { InvoiceReminders } from "@/db/schema/invoice-reminders";
import { ReminderStage } from "@/lib/enums";
import {
  assessReminder,
  daysOverdue,
  describeError,
  generateUuid,
  todayDateString,
  type ReminderAssessment,
} from "@/lib/helpers";
import { sendPaymentReminderEmail } from "@/emails/documents";
import {
  getOpenReceivableItem,
  getOpenReceivableItems,
  type OpenReceivable,
} from "@/lib/server/receivables";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type ReminderCandidate = OpenReceivable & {
  daysOverdue: number | null;
  /** The stage that should go out now, or null with the reason why not. */
  assessment: ReminderAssessment;
};

export type PaymentRemindersView = {
  asOf: string;
  /** Items a reminder is due on, oldest debt first. */
  due: ReminderCandidate[];
  /** Everything else still open, with the reason it is not being chased. */
  held: ReminderCandidate[];
  dueTotal: number;
};

export type ReminderActionResult = {
  error?: string;
  success?: boolean;
  /** Reminders that reached at least one address. */
  sent?: number;
  /** Reminders whose debtor had no address to send to. */
  unaddressed?: number;
  /** Reminders that could not be delivered and will be offered again. */
  failed?: number;
  /** Items that stopped being due between drawing the list and sending. */
  skipped?: number;
};

// What became of one attempt. `stage: null` means nothing was owed a reminder
// any more, which is a normal outcome rather than a failure.
type SendOutcome = {
  stage: ReminderStage | null;
  recorded: boolean;
  recipients: number;
  /** Addresses existed but every send to them failed — worth retrying. */
  undelivered: boolean;
};

// What one attempt amounted to, so a run can be counted up afterwards rather
// than tallied as it goes.
type AttemptResult = "sent" | "unaddressed" | "failed" | "skipped";

const classify = (outcome: SendOutcome): AttemptResult => {
  if (!outcome.stage) {
    return "skipped";
  }
  if (outcome.undelivered) {
    return "failed";
  }
  return outcome.recipients > 0 ? "sent" : "unaddressed";
};

const NOTHING_DUE: SendOutcome = {
  stage: null,
  recorded: false,
  recipients: 0,
  undelivered: false,
};

const toCandidate = (row: OpenReceivable, asOf: string): ReminderCandidate => ({
  ...row,
  daysOverdue: daysOverdue(row.dueDate, asOf),
  assessment: assessReminder({
    outstanding: row.outstanding,
    dueDate: row.dueDate,
    documentType: row.documentType,
    remindersEnabled: row.remindersEnabled,
    lastStageSent: row.lastStageSent,
    asOf,
  }),
});

/**
 * The chase list: which open items are due a reminder today, and which are not
 * — with the reason, so the screen answers "why is this customer not being
 * chased?" without anybody having to work it out.
 */
export const getPaymentReminders = async (): Promise<PaymentRemindersView> => {
  try {
    const asOf = todayDateString();
    const candidates = (await getOpenReceivableItems()).map((row) =>
      toCandidate(row, asOf),
    );
    const due = candidates.filter((row) => row.assessment.stage !== null);

    return {
      asOf,
      due,
      held: candidates.filter((row) => row.assessment.stage === null),
      dueTotal: due.reduce((sum, row) => sum + row.outstanding, 0),
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch payment reminders"));
  }
};

/**
 * Sends one reminder and records that it went.
 *
 * The stage is decided here, from the invoice as it stands now — never taken
 * from the caller. A page left open must not be able to send a final notice to a
 * customer who has since paid, and the unique index on (invoice, stage) is what
 * stops two controllers working the same list sending the same letter twice.
 *
 * Whether the attempt is recorded turns on what happened, because the record is
 * what makes the list move on:
 *   - somebody was reached: recorded, and the stage is spent.
 *   - the debtor has no address at all: recorded with nobody reached. This is a
 *     standing condition, not a hiccup — leaving it unrecorded would have the
 *     list offer the same reminder forever and quietly never escalate.
 *   - addresses existed and the mail failed: not recorded. That is a transient
 *     fault, and burning the stage on it would cost the customer a letter they
 *     never got.
 */
const sendOne = async (
  invoiceUuid: string,
  userId: string,
  asOf: string,
): Promise<SendOutcome> => {
  const row = await getOpenReceivableItem(invoiceUuid);
  if (!row) {
    return NOTHING_DUE;
  }

  const { stage } = assessReminder({
    outstanding: row.outstanding,
    dueDate: row.dueDate,
    documentType: row.documentType,
    remindersEnabled: row.remindersEnabled,
    lastStageSent: row.lastStageSent,
    asOf,
  });

  if (!stage) {
    return NOTHING_DUE;
  }

  const { sent, failed } = await sendPaymentReminderEmail(invoiceUuid, stage);

  if (sent === 0 && failed > 0) {
    return { stage, recorded: false, recipients: 0, undelivered: true };
  }

  await db.insert(InvoiceReminders).values({
    uuid: generateUuid(),
    invoiceUuid,
    companyUuid: row.companyUuid,
    stage,
    outstandingAtSend: row.outstanding.toFixed(2),
    daysOverdueAtSend: daysOverdue(row.dueDate, asOf) ?? 0,
    recipientCount: sent,
    sentByUserId: userId,
  });

  return { stage, recorded: true, recipients: sent, undelivered: false };
};

const refresh = (invoiceUuid?: string) => {
  revalidatePath("/payment-reminders");
  revalidatePath("/debtor-ageing");
  if (invoiceUuid) {
    revalidatePath(`/invoices/${invoiceUuid}`);
  }
};

export const sendPaymentReminder = async (
  invoiceUuid: string,
): Promise<ReminderActionResult> => {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const outcome = await sendOne(invoiceUuid, userId, todayDateString());
    refresh(invoiceUuid);

    if (!outcome.stage) {
      return {
        error:
          "No reminder is due on this invoice any more — it may have been paid, or already chased. Refresh to see where it stands.",
      };
    }
    if (outcome.undelivered) {
      return {
        error:
          "The reminder could not be delivered. Nothing was recorded, so it stays on the list to try again.",
      };
    }

    return {
      success: true,
      sent: outcome.recipients > 0 ? 1 : 0,
      unaddressed: outcome.recipients > 0 ? 0 : 1,
    };
  } catch (error) {
    return { error: describeError(error, "Failed to send the reminder") };
  }
};

/**
 * Chases everything on the list in one run.
 *
 * Each invoice stands alone: one that throws is counted and the run carries on.
 * The point of the button is to clear the list, and a single unreachable debtor
 * must not leave twenty others unchased.
 */
export const sendAllPaymentReminders =
  async (): Promise<ReminderActionResult> => {
    try {
      const user = await currentUser();
      const userId = user?.id;
      if (!userId) {
        return { error: "User not authenticated" };
      }

      const asOf = todayDateString();
      const { due } = await getPaymentReminders();
      const attempts: AttemptResult[] = [];

      for (const candidate of due) {
        try {
          attempts.push(
            classify(await sendOne(candidate.invoiceUuid, userId, asOf)),
          );
        } catch (error) {
          attempts.push("failed");
          console.error(
            `Reminder for invoice ${candidate.invoiceUuid} could not be sent.`,
            error,
          );
        }
      }

      const count = (result: AttemptResult) =>
        attempts.filter((attempt) => attempt === result).length;

      refresh();
      return {
        success: true,
        sent: count("sent"),
        unaddressed: count("unaddressed"),
        failed: count("failed"),
        skipped: count("skipped"),
      };
    } catch (error) {
      return { error: describeError(error, "Failed to send the reminders") };
    }
  };
