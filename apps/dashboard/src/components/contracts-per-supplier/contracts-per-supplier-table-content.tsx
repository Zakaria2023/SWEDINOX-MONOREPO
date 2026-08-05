"use client";

import { ContractPerSupplierRow } from "@/app/(dashboard)/contracts/actions";
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
import { useState } from "react";

type ColumnKey =
  | "id"
  | "companyName"
  | "city"
  | "code"
  | "description"
  | "contractGroupName"
  | "startingDate"
  | "endDate"
  | "preference";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "id", label: "Supplier Code", defaultVisible: true },
  { key: "companyName", label: "Supplier", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "code", label: "Contract Code", defaultVisible: true },
  { key: "description", label: "Contract", defaultVisible: true },
  { key: "contractGroupName", label: "Contract Group", defaultVisible: true },
  { key: "startingDate", label: "Starting Date", defaultVisible: true },
  { key: "endDate", label: "End Date", defaultVisible: true },
  { key: "preference", label: "Preference", defaultVisible: true },
];

type Props = { rows: ContractPerSupplierRow[] };

export const ContractsPerSupplierTable = ({ rows }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: ContractPerSupplierRow, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key}>{row.id}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {row.companyName}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{row.city ?? "—"}</TableCell>;
      case "code":
        return (
          <TableCell key={key} className="font-mono font-medium">
            {row.code}
          </TableCell>
        );
      case "description":
        return <TableCell key={key}>{row.description || "—"}</TableCell>;
      case "contractGroupName":
        return <TableCell key={key}>{row.contractGroupName ?? "—"}</TableCell>;
      case "startingDate":
        return <TableCell key={key}>{row.startingDate ?? "—"}</TableCell>;
      case "endDate":
        return <TableCell key={key}>{row.endDate ?? "—"}</TableCell>;
      case "preference":
        return (
          <TableCell key={key} className="text-right">
            0
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No contracts found for suppliers.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={index}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
