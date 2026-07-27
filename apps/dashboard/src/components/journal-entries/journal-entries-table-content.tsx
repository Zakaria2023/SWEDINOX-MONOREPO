"use client";

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
  <div className="overflow-x-auto rounded-md border">
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
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">VAT</TableHead>
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
                {row.documentNo ?? "—"}
              </TableCell>
              <TableCell>{row.account ?? "—"}</TableCell>
              <TableCell>{row.journal ?? "—"}</TableCell>
              <TableCell>{row.externalAccount ?? "—"}</TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.amount}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.vat}
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
