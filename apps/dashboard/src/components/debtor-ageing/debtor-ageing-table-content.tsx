"use client";

import Link from "next/link";
import { DebtorAgeing } from "@/app/(dashboard)/debtor-ageing/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ageingBuckets } from "@/lib/enums";
import { formatDateValue, formatMoney, invoiceReference } from "@/lib/helpers";
import { AGEING_BUCKET_LABELS, REMINDER_STAGE_LABELS } from "@/lib/labels";

type Props = {
  ageing: DebtorAgeing;
};

const money = (value: number) => (value === 0 ? "—" : formatMoney(value));

/** Blank rather than "0" while an invoice is still inside its term. */
const overdueLabel = (days: number | null) => {
  if (days === null) {
    return "—";
  }
  return days > 0 ? String(days) : "—";
};

export const DebtorAgeingTable = ({ ageing }: Props) => (
  <div className="space-y-6">
    {/* What is owed, split by how late it is. The point of the whole report. */}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ageingBuckets.map((bucket) => (
        <div key={bucket} className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            {AGEING_BUCKET_LABELS[bucket]}
          </p>
          <p className="mt-1 text-2xl font-medium tracking-tight">
            {money(ageing.totals[bucket])}
          </p>
        </div>
      ))}
    </div>

    <p className="text-sm text-muted-foreground">
      {formatMoney(ageing.totals.total)} outstanding across{" "}
      {ageing.items.length} open item{ageing.items.length === 1 ? "" : "s"},
      aged as at {formatDateValue(ageing.asOf, "—")}.
    </p>

    <div className="space-y-2">
      <h2 className="text-lg font-medium tracking-tight">Per debtor</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Items</TableHead>
              {ageingBuckets.map((bucket) => (
                <TableHead key={bucket} className="text-right">
                  {AGEING_BUCKET_LABELS[bucket]}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ageing.byDebtor.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={ageingBuckets.length + 3}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nothing is outstanding on the sales ledger.
                </TableCell>
              </TableRow>
            ) : (
              ageing.byDebtor.map((debtor) => (
                <TableRow key={debtor.companyUuid || "unassigned"}>
                  <TableCell className="font-medium">
                    {debtor.companyUuid ? (
                      <Link
                        href={`/companies/${debtor.companyUuid}`}
                        className="hover:underline"
                      >
                        {debtor.companyName ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        No company on the invoice
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {debtor.invoiceCount}
                  </TableCell>
                  {ageingBuckets.map((bucket) => (
                    <TableCell
                      key={bucket}
                      className="text-right whitespace-nowrap"
                    >
                      {money(debtor.totals[bucket])}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {money(debtor.totals.total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {ageing.byDebtor.length > 0 ? (
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {ageing.items.length}
                </TableCell>
                {ageingBuckets.map((bucket) => (
                  <TableCell
                    key={bucket}
                    className="text-right whitespace-nowrap"
                  >
                    {money(ageing.totals[bucket])}
                  </TableCell>
                ))}
                <TableCell className="text-right whitespace-nowrap">
                  {money(ageing.totals.total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </div>
    </div>

    <div className="space-y-2">
      <h2 className="text-lg font-medium tracking-tight">Open items</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Debtor no.</TableHead>
              <TableHead>Invoice date</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Days overdue</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="text-right">Invoice total</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Last reminder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ageing.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nothing is outstanding on the sales ledger.
                </TableCell>
              </TableRow>
            ) : (
              ageing.items.map((item) => (
                <TableRow key={item.invoiceUuid}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link
                      href={`/invoices/${item.invoiceUuid}`}
                      className="hover:underline"
                    >
                      {invoiceReference(item.documentType, item.invoiceId)}
                    </Link>
                  </TableCell>
                  <TableCell>{item.companyName ?? "—"}</TableCell>
                  <TableCell>{item.debtorNo ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateValue(item.invoiceDate, "—")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateValue(item.dueDate, "—")}
                  </TableCell>
                  <TableCell className="text-right">
                    {overdueLabel(item.daysOverdue)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {AGEING_BUCKET_LABELS[item.bucket]}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {money(item.invoiceTotal)}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {money(item.outstanding)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.lastStageSent
                      ? `${REMINDER_STAGE_LABELS[item.lastStageSent]} · ${formatDateValue(item.lastRemindedAt, "—")}`
                      : "—"}
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
