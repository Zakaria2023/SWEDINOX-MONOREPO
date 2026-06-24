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
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";
import {
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
} from "@/lib/enums";

type ColumnKey =
  | "id"
  | "name"
  | "pickingSequence"
  | "locationType"
  | "loadingLocation"
  | "blocked"
  | "blockReason"
  | "blockedForOptimization"
  | "limitedDimensions";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "name", label: "Name", defaultVisible: true },
  { key: "pickingSequence", label: "Picking Sequence", defaultVisible: true },
  { key: "locationType", label: "Location Type", defaultVisible: true },
  { key: "loadingLocation", label: "Loading Location", defaultVisible: true },
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
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type Props = {
  subSections: SelectWarehouses[];
};

export const WarehouseSubSectionsTableContent = ({ subSections }: Props) => {
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

  const renderCell = (
    subSection: SelectWarehouses,
    key: ColumnKey,
  ) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {subSection.id}
          </TableCell>
        );
      case "name":
        return (
          <TableCell key={key} className="font-medium">
            {subSection.name}
          </TableCell>
        );
      case "pickingSequence":
        return (
          <TableCell key={key}>{subSection.pickingSequence ?? "—"}</TableCell>
        );
      case "locationType":
        return (
          <TableCell key={key}>
            {subSection.locationType
              ? WAREHOUSE_LOCATION_TYPE_LABELS[
                  subSection.locationType as WarehouseLocationType
                ]
              : "—"}
          </TableCell>
        );
      case "loadingLocation":
        return (
          <TableCell key={key}>
            {subSection.loadingLocation
              ? WAREHOUSE_LOADING_LOCATION_LABELS[
                  subSection.loadingLocation as WarehouseLoadingLocation
                ]
              : "—"}
          </TableCell>
        );
      case "blocked":
        return (
          <TableCell key={key}>{subSection.blocked ? "Yes" : "No"}</TableCell>
        );
      case "blockReason":
        return (
          <TableCell key={key}>
            {subSection.blockReason
              ? WAREHOUSE_BLOCK_REASON_LABELS[
                  subSection.blockReason as WarehouseBlockReason
                ]
              : "—"}
          </TableCell>
        );
      case "blockedForOptimization":
        return (
          <TableCell key={key}>
            {subSection.blockedForOptimization ? "Yes" : "No"}
          </TableCell>
        );
      case "limitedDimensions":
        return (
          <TableCell key={key}>
            {subSection.limitedDimensions ? "Yes" : "No"}
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
            {subSections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No warehouse sub sections found
                </TableCell>
              </TableRow>
            ) : (
              subSections.map((subSection) => (
                <TableRow key={subSection.id}>
                  {visibleColumns.map((column) =>
                    renderCell(subSection, column.key),
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
