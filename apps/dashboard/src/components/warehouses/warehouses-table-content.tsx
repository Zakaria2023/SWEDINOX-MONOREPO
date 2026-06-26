"use client";

import { useState } from "react";
import { SelectWarehouses } from "@/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  WAREHOUSE_ADDRESS_LABELS,
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";
import {
  WarehouseAddress,
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
} from "@/lib/enums";
import { WarehouseDocumentCell } from "@/components/warehouses/warehouse-document-cell";

type ColumnKey =
  | "id"
  | "name"
  | "locationType"
  | "loadingLocation"
  | "address"
  | "blocked"
  | "blockReason"
  | "blockedForOptimization"
  | "limitedDimensions"
  | "document";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "name", label: "Name", defaultVisible: true },
  { key: "locationType", label: "Location Type", defaultVisible: true },
  { key: "loadingLocation", label: "Loading Location", defaultVisible: true },
  { key: "address", label: "Address", defaultVisible: true },
  { key: "blocked", label: "Blocked", defaultVisible: true },
  { key: "blockReason", label: "Reason", defaultVisible: false },
  {
    key: "blockedForOptimization",
    label: "Blocked for Optimization",
    defaultVisible: false,
  },
  {
    key: "limitedDimensions",
    label: "Limited Dimensions",
    defaultVisible: false,
  },
  { key: "document", label: "Document", defaultVisible: true },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type Props = {
  warehouses: SelectWarehouses[];
};

export const WarehousesTable = ({ warehouses }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));
  };

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );

  const renderCell = (warehouse: SelectWarehouses, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {warehouse.id}
          </TableCell>
        );
      case "name":
        return (
          <TableCell key={key} className="font-medium">
            {warehouse.name}
          </TableCell>
        );
      case "locationType":
        return (
          <TableCell key={key}>
            {warehouse.locationType
              ? WAREHOUSE_LOCATION_TYPE_LABELS[
                  warehouse.locationType as WarehouseLocationType
                ]
              : "—"}
          </TableCell>
        );
      case "loadingLocation":
        return (
          <TableCell key={key}>
            {warehouse.loadingLocation
              ? WAREHOUSE_LOADING_LOCATION_LABELS[
                  warehouse.loadingLocation as WarehouseLoadingLocation
                ]
              : "—"}
          </TableCell>
        );
      case "address":
        return (
          <TableCell key={key}>
            {warehouse.address
              ? WAREHOUSE_ADDRESS_LABELS[warehouse.address as WarehouseAddress]
              : "—"}
          </TableCell>
        );
      case "blocked":
        return (
          <TableCell key={key}>{warehouse.blocked ? "Yes" : "No"}</TableCell>
        );
      case "blockReason":
        return (
          <TableCell key={key}>
            {warehouse.blockReason
              ? WAREHOUSE_BLOCK_REASON_LABELS[
                  warehouse.blockReason as WarehouseBlockReason
                ]
              : "—"}
          </TableCell>
        );
      case "blockedForOptimization":
        return (
          <TableCell key={key}>
            {warehouse.blockedForOptimization ? "Yes" : "No"}
          </TableCell>
        );
      case "limitedDimensions":
        return (
          <TableCell key={key}>
            {warehouse.limitedDimensions ? "Yes" : "No"}
          </TableCell>
        );
      case "document":
        return (
          <TableCell key={key}>
            <WarehouseDocumentCell warehouse={warehouse} />
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
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No warehouses found
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  {visibleColumns.map((column) =>
                    renderCell(warehouse, column.key),
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
