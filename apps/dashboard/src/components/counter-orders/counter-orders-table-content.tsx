"use client";

import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";
import Link from "next/link";
import { type CounterOrderListItem } from "@/app/(dashboard)/counter-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ColumnSelector } from "@/components/ui/column-selector";
import { buildColumnVisibility, daysInSystem } from "@/lib/helpers";
import {
  COUNTER_ORDER_PRIORITY_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "companyName"
  | "handlingBlocked"
  | "status"
  | "priority"
  | "orderDate"
  | "deliveryDate"
  | "amountExVat"
  | "weightKg"
  | "customerRef"
  | "gainPercent"
  | "daysInSystem"
  | "createdAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "Order no", defaultVisible: true },
  { key: "companyName", label: "Customer", defaultVisible: true },
  { key: "handlingBlocked", label: "Blocked", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "orderDate", label: "Order date", defaultVisible: true },
  { key: "deliveryDate", label: "Delivery date", defaultVisible: true },
  { key: "amountExVat", label: "Amount (ex VAT)", defaultVisible: true },
  { key: "weightKg", label: "Weight (kg)", defaultVisible: true },
  { key: "customerRef", label: "Customer reference", defaultVisible: true },
  { key: "gainPercent", label: "Gain%", defaultVisible: true },
  { key: "daysInSystem", label: "Days in system", defaultVisible: true },
  { key: "priority", label: "Priority", defaultVisible: false },
  { key: "createdAt", label: "Created At", defaultVisible: false },
];

// The columns a header may sort on, matching the keys actions.ts declared.
// A key not named here renders as a plain header.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "customer",
  orderDate: "orderDate",
  status: "status",
};

type CounterOrdersTableProps = {
  page: Paged<CounterOrderListItem>;
  filters: TableFilterControl[];
};

export const CounterOrdersTable = ({
  page,
  filters,
}: CounterOrdersTableProps) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );

  const renderCell = (order: CounterOrderListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/counter-orders/${order.uuid}`}
              className="text-primary hover:underline"
            >
              {order.id}
            </Link>
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {order.companyName}
          </TableCell>
        );
      case "handlingBlocked":
        return (
          <TableCell key={key}>
            {order.handlingBlocked ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Yes
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                No
              </span>
            )}
          </TableCell>
        );
      case "status":
        return (
          <TableCell key={key}>
            <StatusBadge
              value={order.status}
              label={
                order.status ? COUNTER_ORDER_STATUS_LABELS[order.status] : null
              }
            />
          </TableCell>
        );
      case "priority":
        return (
          <TableCell key={key}>
            {order.priority
              ? COUNTER_ORDER_PRIORITY_LABELS[order.priority]
              : "—"}
          </TableCell>
        );
      case "orderDate":
        return <TableCell key={key}>{order.orderDate ?? "—"}</TableCell>;
      case "deliveryDate":
        return <TableCell key={key}>{order.deliveryDate ?? "—"}</TableCell>;
      case "amountExVat":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            € {order.amountExVat}
          </TableCell>
        );
      case "weightKg":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {order.weightKg}
          </TableCell>
        );
      case "customerRef":
        return <TableCell key={key}>{order.customerRef ?? "—"}</TableCell>;
      case "gainPercent":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {order.gainPercent} %
          </TableCell>
        );
      case "daysInSystem":
        return (
          <TableCell key={key} className="text-right">
            {daysInSystem(order.createdAt)}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(order.createdAt).toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search reference or customer…"
        filters={filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </TableToolbar>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => {
                const sortKey = SORTABLE[column.key];
                return sortKey ? (
                  <TableSortHeader key={column.key} sortKey={sortKey}>
                    {column.label}
                  </TableSortHeader>
                ) : (
                  <TableHead key={column.key}>{column.label}</TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No counter orders found
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((order) => (
                <TableRow key={order.uuid}>
                  {visibleColumns.map((column) =>
                    renderCell(order, column.key),
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        singular="counter order"
        plural="counter orders"
      />
    </div>
  );
};
