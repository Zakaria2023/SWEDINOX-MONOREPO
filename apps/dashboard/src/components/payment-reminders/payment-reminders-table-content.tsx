"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck, MailWarning } from "lucide-react";
import {
  PaymentRemindersView,
  ReminderActionResult,
  sendAllPaymentReminders,
  sendPaymentReminder,
} from "@/app/(dashboard)/payment-reminders/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  describeReminderRun,
  formatDateValue,
  formatMoney,
  formatMoneyOrDash,
  invoiceReference,
} from "@/lib/helpers";
import { REMINDER_STAGE_LABELS } from "@/lib/labels";

type Props = {
  reminders: PaymentRemindersView;
};

export const PaymentRemindersTable = ({ reminders }: Props) => {
  const [state, dispatch, isPending] = useActionState<
    ReminderActionResult,
    FormData
  >(async (_previous, formData) => {
    const invoiceUuid = formData.get("invoiceUuid");
    return typeof invoiceUuid === "string" && invoiceUuid.length > 0
      ? sendPaymentReminder(invoiceUuid)
      : sendAllPaymentReminders();
  }, {});

  const summary = describeReminderRun(state);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {reminders.due.length === 0
              ? "Nothing is due a reminder today."
              : `${reminders.due.length} reminder${
                  reminders.due.length === 1 ? "" : "s"
                } due, covering ${formatMoney(reminders.dueTotal)}.`}
          </p>
          <p className="text-muted-foreground">
            Measured as at {formatDateValue(reminders.asOf, "—")}. Each stage is
            sent once per invoice, and a debtor with reminders switched off is
            never chased automatically.
          </p>
        </div>
        {reminders.due.length > 0 ? (
          <form action={dispatch}>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending…" : "Send all due reminders"}
            </Button>
          </form>
        ) : null}
      </div>

      {state.error ? (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <MailWarning size={20} className="mt-0.5 shrink-0" />
          <p>{state.error}</p>
        </div>
      ) : null}

      {summary ? (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <MailCheck size={20} className="mt-0.5 shrink-0" />
          <p>{summary}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-lg font-medium tracking-tight">Due a reminder</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Days overdue</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Last sent</TableHead>
                <TableHead>To send</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.due.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No open item has reached its next reminder threshold.
                  </TableCell>
                </TableRow>
              ) : (
                reminders.due.map((row) => (
                  <TableRow key={row.invoiceUuid}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <Link
                        href={`/invoices/${row.invoiceUuid}`}
                        className="hover:underline"
                      >
                        {invoiceReference(row.documentType, row.invoiceId)}
                      </Link>
                    </TableCell>
                    <TableCell>{row.companyName ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateValue(row.dueDate, "—")}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.daysOverdue ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {formatMoneyOrDash(row.outstanding)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.lastStageSent
                        ? `${REMINDER_STAGE_LABELS[row.lastStageSent]} · ${formatDateValue(row.lastRemindedAt, "—")}`
                        : "Nothing yet"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.assessment.stage
                        ? REMINDER_STAGE_LABELS[row.assessment.stage]
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={dispatch}>
                        <input
                          type="hidden"
                          name="invoiceUuid"
                          value={row.invoiceUuid}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                        >
                          Send
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {reminders.due.length > 0 ? (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total due</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoneyOrDash(reminders.dueTotal)}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
      </div>

      {/* The other half of the answer: everything open that is deliberately not
          being chased, and why. Without it the screen looks like it has lost
          invoices. */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium tracking-tight">Not being chased</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Days overdue</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Last sent</TableHead>
                <TableHead>Why not</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.held.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Every open item is on the chase list.
                  </TableCell>
                </TableRow>
              ) : (
                reminders.held.map((row) => (
                  <TableRow key={row.invoiceUuid}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <Link
                        href={`/invoices/${row.invoiceUuid}`}
                        className="hover:underline"
                      >
                        {invoiceReference(row.documentType, row.invoiceId)}
                      </Link>
                    </TableCell>
                    <TableCell>{row.companyName ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateValue(row.dueDate, "—")}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.daysOverdue !== null && row.daysOverdue > 0
                        ? row.daysOverdue
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatMoneyOrDash(row.outstanding)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.lastStageSent
                        ? `${REMINDER_STAGE_LABELS[row.lastStageSent]} · ${formatDateValue(row.lastRemindedAt, "—")}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.assessment.reason ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
