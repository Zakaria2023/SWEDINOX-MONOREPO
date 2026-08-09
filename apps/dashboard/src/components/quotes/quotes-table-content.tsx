"use client";

import Link from "next/link";
import { exportQuotes, QuoteListItem } from "@/app/(dashboard)/quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { ORDER_METHOD_LABELS } from "@/lib/labels";
import { OrderMethod } from "@/lib/enums";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<QuoteListItem>;
  filters: TableFilterControl[];
};

export const QuotesTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search reference or customer…"
      filters={filters}
    >
      <PagedTableExportButton fileName="quotes" action={exportQuotes} />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableSortHeader sortKey="customer">Customer</TableSortHeader>
          <TableHead>Contact</TableHead>
          <TableHead>Request</TableHead>
          <TableSortHeader sortKey="validUntil">Valid Until</TableSortHeader>
          <TableSortHeader sortKey="createdAt">Created</TableSortHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No quotes found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/quotes/${row.uuid}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
              </TableCell>
              <TableCell>{row.companyName ?? "—"}</TableCell>
              <TableCell>
                {[row.contactFirstName, row.contactLastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell>
                {row.requestMethod
                  ? (ORDER_METHOD_LABELS[row.requestMethod as OrderMethod] ??
                    row.requestMethod)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.validUntil
                  ? new Date(row.validUntil).toLocaleDateString("en-GB")
                  : "—"}
              </TableCell>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString("en-GB")}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    <TablePagination page={page} singular="quote" plural="quotes" />
  </div>
);
