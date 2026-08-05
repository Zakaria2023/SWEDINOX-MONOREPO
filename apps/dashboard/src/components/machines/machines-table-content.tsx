"use client";

import Link from "next/link";
import { useState } from "react";
import { MachineListItem } from "@/app/(dashboard)/machines/actions";
import { DocumentCell } from "@/components/ui/document-cell";
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
  MachineCapacityUnit,
  MachineLoadingType,
  MachineOptionType,
  MachineProductionType,
} from "@/lib/enums";
import {
  MACHINE_CAPACITY_UNIT_CODES,
  MACHINE_LOADING_LABELS,
  MACHINE_OPTION_LABELS,
  MACHINE_PRODUCTION_LABELS,
} from "@/lib/labels";

type ColumnKey =
  | "code"
  | "name"
  | "option"
  | "production"
  | "loading"
  | "stockLocation"
  | "minLengthMm"
  | "maxLengthMm"
  | "outOfBusiness"
  | "averageDailyCapacity"
  | "warningPercentage"
  | "documents";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "code", label: "Code", defaultVisible: true },
  { key: "name", label: "Name", defaultVisible: true },
  { key: "option", label: "Option", defaultVisible: true },
  { key: "production", label: "Production", defaultVisible: true },
  { key: "loading", label: "Loading", defaultVisible: false },
  { key: "stockLocation", label: "Stock Location", defaultVisible: true },
  { key: "minLengthMm", label: "Min Length", defaultVisible: false },
  { key: "maxLengthMm", label: "Max Length", defaultVisible: false },
  { key: "outOfBusiness", label: "Out of Business", defaultVisible: false },
  {
    key: "averageDailyCapacity",
    label: "Average Daily Capacity",
    defaultVisible: true,
  },
  {
    key: "warningPercentage",
    label: "Warning %",
    defaultVisible: true,
  },
  { key: "documents", label: "Documents", defaultVisible: true },
];

type Props = {
  machines: MachineListItem[];
};

export const MachinesTable = ({ machines }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));
  };

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );

  const renderCell = (machine: MachineListItem, key: ColumnKey) => {
    switch (key) {
      case "code":
        return (
          <TableCell key={key} className="font-mono font-medium">
            <Link
              href={`/machines/${machine.uuid}`}
              className="text-primary hover:underline"
            >
              {machine.code}
            </Link>
          </TableCell>
        );
      case "name":
        return (
          <TableCell key={key} className="font-medium">
            {machine.name}
          </TableCell>
        );
      case "option":
        return (
          <TableCell key={key}>
            {MACHINE_OPTION_LABELS[machine.option as MachineOptionType]}
          </TableCell>
        );
      case "production":
        return (
          <TableCell key={key}>
            {
              MACHINE_PRODUCTION_LABELS[
                machine.production as MachineProductionType
              ]
            }
          </TableCell>
        );
      case "loading":
        return (
          <TableCell key={key}>
            {MACHINE_LOADING_LABELS[machine.loading as MachineLoadingType]}
          </TableCell>
        );
      case "stockLocation":
        return (
          <TableCell key={key}>{machine.stockLocationName ?? "-"}</TableCell>
        );
      case "minLengthMm":
        return (
          <TableCell key={key}>
            {machine.minLengthMm !== null ? `${machine.minLengthMm} mm` : "-"}
          </TableCell>
        );
      case "maxLengthMm":
        return (
          <TableCell key={key}>
            {machine.maxLengthMm !== null ? `${machine.maxLengthMm} mm` : "-"}
          </TableCell>
        );
      case "outOfBusiness":
        return (
          <TableCell key={key}>
            {machine.outOfBusiness ? "Yes" : "No"}
          </TableCell>
        );
      case "averageDailyCapacity":
        return (
          <TableCell key={key}>
            {machine.averageDailyCapacity !== null &&
            machine.averageDailyCapacityUnit
              ? `${machine.averageDailyCapacity} ${
                  MACHINE_CAPACITY_UNIT_CODES[
                    machine.averageDailyCapacityUnit as MachineCapacityUnit
                  ]
                } per day`
              : "-"}
          </TableCell>
        );
      case "warningPercentage":
        return (
          <TableCell key={key}>
            {machine.warningPercentage !== null
              ? `${machine.warningPercentage}%`
              : "-"}
          </TableCell>
        );
      case "documents":
        return (
          <TableCell key={key}>
            <DocumentCell documents={machine.documents} />
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

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No machines found
                </TableCell>
              </TableRow>
            ) : (
              machines.map((machine) => (
                <TableRow key={machine.id}>
                  {visibleColumns.map((column) =>
                    renderCell(machine, column.key),
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
