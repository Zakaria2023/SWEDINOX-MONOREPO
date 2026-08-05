import Link from "next/link";
import { JournalEntryDetail } from "@/app/(dashboard)/journal-entries/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  orDash,
} from "@/lib/helpers";
import { LEDGER_ACCOUNT_TYPE_LABELS } from "@/lib/labels";

type Props = {
  entry: JournalEntryDetail;
};

export const JournalEntryDetailView = ({ entry }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Posting line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Booking date"
          value={formatDateColumn(entry.bookingDate)}
        />
        <DetailField
          label="Document date"
          value={formatDateColumn(entry.documentDate)}
        />
        <DetailField label="Document number" value={entry.documentNo} />
        <DetailField label="Journal" value={entry.journal} />
        <DetailField label="Account" value={entry.account} />
        <DetailField label="Account name" value={entry.accountName} />
        <DetailField
          label="Account type"
          value={
            entry.accountType
              ? LEDGER_ACCOUNT_TYPE_LABELS[entry.accountType]
              : null
          }
        />
        <DetailField label="External account" value={entry.externalAccount} />
        <DetailField label="Debtor / creditor" value={entry.debCreditor} />
        <DetailField label="Description" value={entry.description} />
        <DetailField label="Reference" value={entry.reference} />
        <DetailField
          label="Debit"
          value={formatMoney(Number(entry.debit))}
        />
        <DetailField
          label="Credit"
          value={formatMoney(Number(entry.credit))}
        />
        <DetailField
          label="Signed amount"
          value={formatMoney(Number(entry.amount))}
        />
        <DetailField label="Financial year" value={entry.financialYear} />
        <DetailField label="Period" value={entry.period} />
        <DetailField label="Created by" value={entry.createdByUserId} />
        <DetailField label="Created" value={formatDateValue(entry.createdAt)} />
      </div>
      <DetailField label="Explanation" value={entry.explanation} />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Source</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          {entry.companyUuid && entry.companyName ? (
            <Link
              href={`/companies/${entry.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {entry.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Sales invoice
          </p>
          {entry.invoiceUuid ? (
            <Link
              href={`/invoices/${entry.invoiceUuid}`}
              className="text-sm text-primary hover:underline"
            >
              View invoice
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase invoice
          </p>
          {entry.purchaseInvoiceUuid ? (
            <Link
              href={`/purchase-invoices/${entry.purchaseInvoiceUuid}`}
              className="text-sm text-primary hover:underline"
            >
              View invoice
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Transmission date"
          value={formatDateColumn(entry.transmissionDate)}
        />
        <DetailField
          label="Transmission failure"
          value={entry.transmissionFailureCause}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        The whole entry
      </h2>
      <p className="text-sm text-muted-foreground">
        {entry.entryUuid
          ? "The lines of one document, which should balance."
          : "This line predates the double-sided ledger and has no entry group."}
      </p>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Account name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entry.siblingLines.map((row) => (
              <TableRow
                key={row.uuid}
                className={row.uuid === entry.uuid ? "bg-muted/50" : undefined}
              >
                <TableCell className="font-medium">
                  {row.uuid === entry.uuid ? (
                    orDash(row.account)
                  ) : (
                    <Link
                      href={`/journal-entries/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.account ?? "View line"}
                    </Link>
                  )}
                </TableCell>
                <TableCell>{orDash(row.accountName)}</TableCell>
                <TableCell>{orDash(row.description)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(row.debit))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(row.credit))}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(entry.entryTotals.debit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(entry.entryTotals.credit)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {entry.entryTotals.balanced ? (
        <p className="text-sm text-muted-foreground">
          Debits equal credits — the entry balances.
        </p>
      ) : (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          This entry does not balance: debits and credits differ by{" "}
          {formatMoney(
            Math.abs(entry.entryTotals.debit - entry.entryTotals.credit),
          )}
          .
        </p>
      )}
    </section>
  </div>
);
