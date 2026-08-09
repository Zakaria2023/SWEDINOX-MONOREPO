"use client";

import Link from "next/link";
import { exportOrders, OrderListItem } from "@/app/(dashboard)/orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ORDER_METHOD_LABELS } from "@/lib/labels";
import { OrderMethod } from "@/lib/enums";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<OrderListItem>;
  filters: TableFilterControl[];
};

export const OrdersTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search reference or customer…"
      filters={filters}
    >
      <PagedTableExportButton fileName="orders" action={exportOrders} />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableSortHeader sortKey="company">Company</TableSortHeader>
          <TableHead>Contact</TableHead>
          <TableHead>Method</TableHead>
          <TableSortHeader sortKey="deliveryDate">
            Delivery Date
          </TableSortHeader>
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
              No orders found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/orders/${row.uuid}`}
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
                {row.orderMethod
                  ? (ORDER_METHOD_LABELS[row.orderMethod as OrderMethod] ??
                    row.orderMethod)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.deliveryDate
                  ? new Date(row.deliveryDate).toLocaleDateString("en-GB")
                  : row.deliveryWeek && row.deliveryYear
                    ? `W${row.deliveryWeek} ${row.deliveryYear}`
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
    <TablePagination page={page} singular="order" plural="orders" />
  </div>
);
