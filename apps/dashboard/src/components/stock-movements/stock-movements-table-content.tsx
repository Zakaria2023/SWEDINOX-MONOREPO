"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportStockMovements,
  StockMovementListItem,
} from "@/app/(dashboard)/stock-movements/actions";
import {
  STOCK_MOVEMENT_COLUMNS,
  StockMovementColumnKey,
} from "@/app/(dashboard)/stock-movements/columns";
import { ColumnSelector } from "@/components/ui/column-selector";
import { ExportValueCell } from "@/components/ui/export-value-cell";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { buildColumnVisibility } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/lib/labels";

type ColumnKey = StockMovementColumnKey;

type Props = {
  page: Paged<StockMovementListItem>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(STOCK_MOVEMENT_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  createdAt: "createdAt",
  productCode: "product",
  type: "type",
  reason: "reason",
  quantity: "quantity",
};

const LINK_CLASS =
  "font-medium text-foreground underline-offset-4 hover:underline";

export const StockMovementsTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = STOCK_MOVEMENT_COLUMNS.filter(
    (col) => columnVisibility[col.key],
  );

  const renderCell = (row: StockMovementListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/stock-movements/${row.uuid}`}
              className="underline-offset-4 hover:underline"
            >
              {row.id}
            </Link>
          </TableCell>
        );
      case "type":
        return (
          <TableCell key={key}>
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
        );
      case "createdAt":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {new Date(row.createdAt).toLocaleString("en-GB")}
          </TableCell>
        );
      case "source":
        return (
          <TableCell key={key}>
            {row.purchaseOrderId ? (
              <Link
                href={`/purchase-orders/${row.purchaseOrderUuid}`}
                className={LINK_CLASS}
              >
                Purchase Order #{row.purchaseOrderId}
              </Link>
            ) : row.purchaseInvoiceId ? (
              <Link
                href={`/purchase-invoices/${row.purchaseInvoiceUuid}`}
                className={LINK_CLASS}
              >
                Purchase Invoice #{row.purchaseInvoiceId}
              </Link>
            ) : row.orderId ? (
              <Link href={`/orders/${row.orderUuid}`} className={LINK_CLASS}>
                Order #{row.orderId}
              </Link>
            ) : row.invoiceId ? (
              <Link
                href={`/invoices/${row.invoiceUuid}`}
                className={LINK_CLASS}
              >
                Invoice #{row.invoiceId}
              </Link>
            ) : (
              "—"
            )}
          </TableCell>
        );
      default: {
        const column = STOCK_MOVEMENT_COLUMNS.find((col) => col.key === key);
        return (
          <ExportValueCell key={key} value={column ? column.value(row) : null} />
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product or note…"
        filters={filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="stock-movements"
          action={exportStockMovements}
          columnKeys={visibleColumns.map((col) => col.key)}
        />
      </TableToolbar>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => {
                const sortKey = SORTABLE[col.key];
                return sortKey ? (
                  <TableSortHeader key={col.key} sortKey={sortKey}>
                    {col.label}
                  </TableSortHeader>
                ) : (
                  <TableHead key={col.key} className="whitespace-nowrap">
                    {col.label}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((row) => (
                <TableRow key={row.uuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} singular="movement" plural="movements" />
    </div>
  );
};
