"use client";

import Link from "next/link";
import { JournalEntryListItem } from "@/app/(dashboard)/journal-entries/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type Props = {
  entries: JournalEntryListItem[];
};

export const JournalEntriesTable = ({ entries }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Booking date</TableHead>
          <TableHead>Document</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Journal</TableHead>
          <TableHead>External account</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Debit</TableHead>
          <TableHead className="text-right">Credit</TableHead>
          <TableHead>Deb/Creditor</TableHead>
          <TableHead>Document date</TableHead>
          <TableHead>Explanation</TableHead>
          <TableHead>Transmission date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={13}
              className="h-24 text-center text-muted-foreground"
            >
              No journal entries found.
            </TableCell>
          </TableRow>
        ) : (
          entries.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{row.bookingDate ?? "—"}</TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/journal-entries/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.documentNo ?? `Posting #${row.id}`}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.account ?? "—"}
                {row.accountName ? (
                  <span className="text-muted-foreground"> {row.accountName}</span>
                ) : null}
              </TableCell>
              <TableCell>{row.journal ?? "—"}</TableCell>
              <TableCell>{row.externalAccount ?? "—"}</TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {Number(row.debit) === 0 ? "—" : `€ ${row.debit}`}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {Number(row.credit) === 0 ? "—" : `€ ${row.credit}`}
              </TableCell>
              <TableCell>{row.debCreditor ?? row.companyName ?? "—"}</TableCell>
              <TableCell>{row.documentDate ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.explanation ?? "—"}
              </TableCell>
              <TableCell>{row.transmissionDate ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
