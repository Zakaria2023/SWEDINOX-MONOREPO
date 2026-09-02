"use client";

import Link from "next/link";
import {
  exportWarehouseWorkOrders,
  WorkOrderListItem,
} from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { formatDateColumn } from "@/lib/helpers";
import {
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<WorkOrderListItem>;
  filters: TableFilterControl[];
};

export const WarehouseWorkOrdersTable = ({ page, filters }: Props) => (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search number, order or product…"
        filters={filters}
      >
        <PagedTableExportButton
          fileName="warehouse-work-orders"
          action={exportWarehouseWorkOrders}
        />
      </TableToolbar>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableSortHeader sortKey="number">Number</TableSortHeader>
              <TableSortHeader sortKey="plannedDate">Planned</TableSortHeader>
              <TableSortHeader sortKey="type">Type</TableSortHeader>
              <TableHead>Warehouse</TableHead>
              <TableSortHeader sortKey="status">Status</TableSortHeader>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="text-right">Qty planned / actual</TableHead>
              <TableHead className="text-right">Kg planned / actual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No warehouse work orders found.
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/warehouse-work-orders/${row.uuid}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {row.number}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDateColumn(row.plannedDate)}</TableCell>
                  <TableCell>
                    {WAREHOUSE_WORK_ORDER_TYPE_LABELS[row.type]}
                  </TableCell>
                  <TableCell>{row.warehouseName ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={row.status}
                      label={WAREHOUSE_WORK_ORDER_STATUS_LABELS[row.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.lineCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.qtyPlanned} / {row.qtyActual}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.kgPlanned} / {row.kgActual}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} singular="work order" plural="work orders" />
    </div>
  );
