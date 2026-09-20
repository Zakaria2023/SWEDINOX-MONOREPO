"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportUnblockedOrders,
  UnblockedOrderRow,
} from "@/app/(dashboard)/unblocked-orders/actions";
import {
  UNBLOCKED_ORDER_COLUMNS,
  UnblockedOrderColumnKey,
} from "@/app/(dashboard)/unblocked-orders/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatDateValue,
  monthLabel,
  orDash,
  orderDeblockTypeLabel,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = UnblockedOrderColumnKey;

type Props = {
  page: Paged<UnblockedOrderRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(UNBLOCKED_ORDER_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  customerName: "customerName",
  deblockType: "deblockType",
  deblockDate: "deblockDate",
  deblockTime: "deblockDate",
  order: "order",
  orderCreatedAt: "orderCreatedAt",
  orderAmount: "orderAmount",
};

const money = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const clockTime = (value: Date): string =>
  `${String(new Date(value).getHours()).padStart(2, "0")}:${String(
    new Date(value).getMinutes(),
  ).padStart(2, "0")}`;

export const UnblockedOrdersTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: UnblockedOrderRow, key: ColumnKey) => {
    switch (key) {
      case "customerName":
        return (
          <TableCell key={key} className="font-medium">
            {row.companyUuid ? (
              <Link
                href={`/companies/${row.companyUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.customerName)}
              </Link>
            ) : (
              orDash(row.customerName)
            )}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "debtorNumber":
        return <TableCell key={key}>{orDash(row.debtorNumber)}</TableCell>;
      case "deblockType":
        return (
          <TableCell key={key}>
            {orderDeblockTypeLabel(row.deblockType)}
          </TableCell>
        );
      case "year":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.year ?? "—"}
          </TableCell>
        );
      case "month":
        return (
          <TableCell key={key}>
            {row.month ? monthLabel(row.month) : "—"}
          </TableCell>
        );
      case "deblockDate":
        return (
          <TableCell key={key}>{formatDateValue(row.deblockDate)}</TableCell>
        );
      case "deblockTime":
        return (
          <TableCell key={key} className="tabular-nums">
            {clockTime(row.deblockDate)}
          </TableCell>
        );
      case "deblockedBy":
        return <TableCell key={key}>{orDash(row.deblockedBy)}</TableCell>;
      case "order":
        return (
          <TableCell key={key} className="font-medium">
            {row.orderUuid ? (
              <Link
                href={`/orders/${row.orderUuid}`}
                className="text-primary hover:underline"
              >
                {row.orderCode ?? row.orderId}
              </Link>
            ) : (
              (row.orderCode ?? row.orderId ?? "—")
            )}
          </TableCell>
        );
      case "orderCreatedAt":
        return (
          <TableCell key={key}>{formatDateValue(row.orderCreatedAt)}</TableCell>
        );
      case "orderAmount":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {money(row.orderAmount)}
          </TableCell>
        );
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search customer or order…"
        filters={filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="unblocked-orders"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportUnblockedOrders}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No blocks lifted</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A row appears here each time somebody releases an order. Try
            clearing the search or the filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((col) => {
                    const sortKey = SORTABLE[col.key];
                    if (sortKey) {
                      return (
                        <TableSortHeader key={col.key} sortKey={sortKey}>
                          {col.label}
                        </TableSortHeader>
                      );
                    }
                    return <TableHead key={col.key}>{col.label}</TableHead>;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.deblockUuid}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="release" plural="releases" />
        </>
      )}
    </div>
  );
};
