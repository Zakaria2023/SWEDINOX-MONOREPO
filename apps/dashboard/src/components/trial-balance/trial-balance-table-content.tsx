"use client";

import { useActionState } from "react";
import { AlertTriangle, Boxes, CheckCircle2 } from "lucide-react";
import {
  SeedChartResult,
  seedChartOfAccounts,
  TrialBalance,
} from "@/app/(dashboard)/trial-balance/actions";
import { formatMoneyOrDash } from "@/lib/helpers";
import { LEDGER_ACCOUNT_TYPE_LABELS } from "@/lib/labels";
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
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  trialBalance: TrialBalance;
};

export const TrialBalanceTable = ({ trialBalance }: Props) => {
  const [state, dispatch, isPending] = useActionState<
    SeedChartResult,
    FormData
  >(async () => seedChartOfAccounts(), {});

  return (
    <div className="space-y-4">
      {/* The whole point of the report: say plainly whether the ledger holds. */}
      <div
        className={`flex items-start gap-3 rounded-md border p-4 ${
          trialBalance.balanced
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
            : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        }`}
      >
        {trialBalance.balanced ? (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        )}
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {trialBalance.balanced
              ? "The ledger balances."
              : `The ledger is out by ${formatMoneyOrDash(trialBalance.difference)}.`}
          </p>
          <p>
            Debits {formatMoneyOrDash(trialBalance.totalDebit)} against credits{" "}
            {formatMoneyOrDash(trialBalance.totalCredit)} across{" "}
            {trialBalance.rows.length} account
            {trialBalance.rows.length === 1 ? "" : "s"}.
          </p>
          {trialBalance.balanced ? null : (
            <p>
              A difference means an entry posted one side and not the other. The
              journal is the place to look — sort by document.
            </p>
          )}
        </div>
      </div>

      {/* The one balance with a second source of truth to check it against. */}
      <div
        className={`flex items-start gap-3 rounded-md border p-4 ${
          trialBalance.inventory.reconciled
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
            : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        }`}
      >
        {trialBalance.inventory.reconciled ? (
          <Boxes size={20} className="mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        )}
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {trialBalance.inventory.reconciled
              ? "Inventory agrees with the stock on the shelves."
              : `Inventory is out by ${formatMoneyOrDash(trialBalance.inventory.difference)} against the stock on the shelves.`}
          </p>
          <p>
            The ledger carries{" "}
            {formatMoneyOrDash(trialBalance.inventory.ledgerValue)}; the stock
            lots are valued at{" "}
            {formatMoneyOrDash(trialBalance.inventory.stockValue)}.
          </p>
          {trialBalance.inventory.deliveredNotInvoiced === 0 ? null : (
            <p>
              {formatMoneyOrDash(trialBalance.inventory.deliveredNotInvoiced)}{" "}
              of cost sits on goods that have shipped and not been invoiced.
            </p>
          )}
          {trialBalance.inventory.returnedNotCredited === 0 ? null : (
            <p>
              {formatMoneyOrDash(trialBalance.inventory.returnedNotCredited)} of
              cost sits on goods sent back to suppliers who have not credited
              them.
            </p>
          )}
          {trialBalance.inventory.reconciled ? null : (
            <p>
              A difference means stock moved without the ledger following it, or
              a lot was revalued outside a posting.
            </p>
          )}
        </div>
      </div>

      {trialBalance.unnamedAccounts.length > 0 ? (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p>
            {trialBalance.chartMissing
              ? "No chart of accounts exists yet, so these account numbers have no names:"
              : "These accounts carry postings but are not in the chart of accounts:"}{" "}
            <span className="font-medium">
              {trialBalance.unnamedAccounts.join(", ")}
            </span>
          </p>
          <form action={dispatch}>
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending
                ? "Creating…"
                : "Create the standard chart of accounts"}
            </Button>
          </form>
          {state.error ? (
            <p className="text-red-700 dark:text-red-300">{state.error}</p>
          ) : null}
          {state.created ? (
            <p>
              {state.created} account{state.created === 1 ? "" : "s"} created.
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <div className="space-y-4">
          <div className="flex justify-end">
            <TableExportButton
              tableId="trial-balance-table"
              fileName="trial-balance"
              sheetName="Trial balance"
            />
          </div>
          <Table id="trial-balance-table">
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalance.rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nothing has been posted to the general ledger yet.
                  </TableCell>
                </TableRow>
              ) : (
                trialBalance.rows.map((row) => (
                  <TableRow key={row.account}>
                    <TableCell className="font-medium">{row.account}</TableCell>
                    <TableCell>
                      {row.accountName ?? (
                        <span className="text-muted-foreground">
                          Not in the chart
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.accountType
                        ? LEDGER_ACCOUNT_TYPE_LABELS[row.accountType]
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.lineCount}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatMoneyOrDash(row.totalDebit)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatMoneyOrDash(row.totalCredit)}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {formatMoneyOrDash(row.balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {trialBalance.rows.length > 0 ? (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoneyOrDash(trialBalance.totalDebit)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoneyOrDash(trialBalance.totalCredit)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoneyOrDash(trialBalance.difference)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
      </div>
    </div>
  );
};
