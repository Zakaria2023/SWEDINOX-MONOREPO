"use client";

import Link from "next/link";
import { StockMovementListItem } from "@/app/(dashboard)/stock-movements/actions";
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
import {
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  page: Paged<StockMovementListItem>;
  filters: TableFilterControl[];
};

export const StockMovementsTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search product or note…"
      filters={filters}
    />
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableSortHeader sortKey="product">Product</TableSortHeader>
            <TableSortHeader sortKey="type">Type</TableSortHeader>
            <TableSortHeader sortKey="reason">Reason</TableSortHeader>
            <TableSortHeader sortKey="quantity" className="text-right">
              Quantity
            </TableSortHeader>
            <TableHead>Source</TableHead>
            <TableSortHeader sortKey="createdAt">Time</TableSortHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No stock movements found.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  <Link
                    href={`/stock-movements/${row.uuid}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.id}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {[row.productCode, row.productName]
                    .filter(Boolean)
                    .join(" — ") || "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      row.type === "in"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                    }
                  >
                    {STOCK_MOVEMENT_TYPE_LABELS[row.type]}
                  </span>
                </TableCell>
                <TableCell>
                  <div>{STOCK_MOVEMENT_REASON_LABELS[row.reason]}</div>
                  {row.note && (
                    <div className="text-xs text-muted-foreground">
                      {row.note}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell>
                  {row.purchaseOrderId ? (
                    <Link
                      href={`/purchase-orders/${row.purchaseOrderUuid}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Purchase Order #{row.purchaseOrderId}
                    </Link>
                  ) : row.purchaseInvoiceId ? (
                    <Link
                      href={`/purchase-invoices/${row.purchaseInvoiceUuid}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Purchase Invoice #{row.purchaseInvoiceId}
                    </Link>
                  ) : row.orderId ? (
                    <Link
                      href={`/orders/${row.orderUuid}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Order #{row.orderId}
                    </Link>
                  ) : row.invoiceId ? (
                    <Link
                      href={`/invoices/${row.invoiceUuid}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Invoice #{row.invoiceId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(row.createdAt).toLocaleString("en-GB")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    <TablePagination page={page} singular="movement" plural="movements" />
  </div>
);
