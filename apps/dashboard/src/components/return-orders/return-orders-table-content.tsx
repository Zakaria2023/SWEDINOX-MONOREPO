"use client";

import Link from "next/link";
import {
  exportReturnOrders,
  ReturnOrderListItem,
} from "@/app/(dashboard)/return-orders/actions";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TableNewLink } from "@/components/ui/table-new-link";
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
import { RETURN_ORDER_REASON_LABELS } from "@/lib/labels";
import { ReturnOrderReason } from "@/lib/enums";

type Props = {
  page: Paged<ReturnOrderListItem>;
  filters: TableFilterControl[];
};

export const ReturnOrdersTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search reference or customer…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="return-orders"
        action={exportReturnOrders}
      />
      <TableNewLink href="/return-orders/new">New Return Order</TableNewLink>
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableSortHeader sortKey="customer">Customer</TableSortHeader>
          <TableHead>Contact</TableHead>
          <TableHead>Return Reason</TableHead>
          <TableSortHeader sortKey="returnDate">Return Date</TableSortHeader>
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
              No return orders found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/return-orders/${row.uuid}`}
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
                {row.returnReason
                  ? (RETURN_ORDER_REASON_LABELS[
                      row.returnReason as ReturnOrderReason
                    ] ?? row.returnReason)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.returnDate
                  ? new Date(row.returnDate).toLocaleDateString("en-GB")
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
    <TablePagination
      page={page}
      singular="return order"
      plural="return orders"
    />
  </div>
);
