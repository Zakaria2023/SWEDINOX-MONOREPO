"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
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
import { TableNewLink } from "@/components/ui/table-new-link";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { cn } from "@/lib/helpers";
import { PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import { PurchaseOrderType } from "@/lib/enums";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<PurchaseOrderListItem>;
  filters: TableFilterControl[];
};

export const PurchaseOrdersTable = ({ page, filters }: Props) => {
  // The reference acts on a selected row from a toolbar at the top, so the
  // row is picked first and the buttons then say where they go.
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected =
    page.rows.find((row) => row.uuid === selectedUuid) ?? null;

  const rowActions: TableRowActionItem[] = [
    {
      label: "View",
      icon: <Eye className="size-4" />,
      href: selected ? `/purchase-orders/${selected.uuid}` : null,
    },
    {
      label: "Edit",
      icon: <Pencil className="size-4" />,
      href: selected ? `/purchase-orders/${selected.uuid}/edit` : null,
    },
  ];

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search reference or supplier…"
        filters={filters}
      >
        <PagedTableExportButton
          fileName="purchase-orders"
          action={exportPurchaseOrders}
        />
        <TableNewLink href="/purchase-orders/new">
          New Purchase Order
        </TableNewLink>
      </TableToolbar>
      <TableRowToolbar
        actions={rowActions}
        selectedLabel={selected ? `IO${selected.id}` : null}
      />
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
              <TableRow
                key={row.uuid}
                onClick={() => setSelectedUuid(row.uuid)}
                className={cn(
                  "cursor-pointer",
                  row.uuid === selectedUuid && "bg-muted",
                )}
              >
                <TableCell>
                  <Link
                    href={`/purchase-orders/${row.uuid}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={(event) => event.stopPropagation()}
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
};
