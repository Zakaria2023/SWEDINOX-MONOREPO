"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { buildColumnVisibility } from "@/lib/helpers";
import {
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { WarehouseWorkOrderStatus } from "@/lib/enums";
import { WorkOrderListItem } from "@/app/(dashboard)/warehouse-work-orders/actions";

type ColumnKey = "id" | "warehouseName" | "status" | "createdAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "warehouseName", label: "Warehouse", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "createdAt", label: "Created At", defaultVisible: true },
];

type Props = {
  workOrders: WorkOrderListItem[];
};

export const WarehouseWorkOrdersTable = ({ workOrders }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));
  };

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );

  const renderCell = (workOrder: WorkOrderListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/warehouse-work-orders/${workOrder.uuid}`}
              className="text-primary hover:underline"
            >
              {workOrder.id}
            </Link>
          </TableCell>
        );
      case "warehouseName":
        return (
          <TableCell key={key}>{workOrder.warehouseName ?? "—"}</TableCell>
        );
      case "status":
        return (
          <TableCell key={key}>
            {WAREHOUSE_WORK_ORDER_STATUS_LABELS[
              workOrder.status as WarehouseWorkOrderStatus
            ] ?? workOrder.status}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(workOrder.createdAt).toLocaleDateString("en-GB")}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No warehouse work orders found
                </TableCell>
              </TableRow>
            ) : (
              workOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  {visibleColumns.map((column) =>
                    renderCell(workOrder, column.key),
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
