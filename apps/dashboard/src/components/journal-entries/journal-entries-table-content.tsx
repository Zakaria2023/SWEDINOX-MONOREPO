"use client";

import Link from "next/link";
import {
  exportJournalEntries,
  JournalEntryListItem,
} from "@/app/(dashboard)/journal-entries/actions";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type Props = {
  page: Paged<JournalEntryListItem>;
  filters: TableFilterControl[];
};

export const JournalEntriesTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search document, description, reference or counterparty…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="journal-entries"
        action={exportJournalEntries}
      />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableSortHeader sortKey="bookingDate">Booking date</TableSortHeader>
          <TableSortHeader sortKey="documentNo">Document</TableSortHeader>
          <TableSortHeader sortKey="account">Account</TableSortHeader>
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
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={13}
              className="h-24 text-center text-muted-foreground"
            >
              No journal entries found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
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
                  <span className="text-muted-foreground">
                    {" "}
                    {row.accountName}
                  </span>
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
    <TablePagination page={page} singular="posting" plural="postings" />
  </div>
);
