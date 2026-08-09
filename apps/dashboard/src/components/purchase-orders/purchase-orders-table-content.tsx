"use client";

import Link from "next/link";
import {
  exportPurchaseOrders,
  PurchaseOrderListItem,
} from "@/app/(dashboard)/purchase-orders/actions";
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
import { PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import { PurchaseOrderType } from "@/lib/enums";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<PurchaseOrderListItem>;
  filters: TableFilterControl[];
};

export const PurchaseOrdersTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search reference or supplier…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="purchase-orders"
        action={exportPurchaseOrders}
      />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableSortHeader sortKey="supplier">Supplier</TableSortHeader>
          <TableHead>Contact</TableHead>
          <TableHead>Type</TableHead>
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
              No purchase orders found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/purchase-orders/${row.uuid}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
              </TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell>
                {[row.contactFirstName, row.contactLastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell>
                {row.purchaseOrderType
                  ? (PURCHASE_ORDER_TYPE_LABELS[
                      row.purchaseOrderType as PurchaseOrderType
                    ] ?? row.purchaseOrderType)
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
    <TablePagination
      page={page}
      singular="purchase order"
      plural="purchase orders"
    />
  </div>
);
