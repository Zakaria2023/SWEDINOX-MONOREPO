"use client";

import { ContractPerCustomerRow } from "@/app/(dashboard)/contracts/actions";
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
import { COMPANY_ROLE_LABELS } from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "role"
  | "id"
  | "companyName"
  | "city"
  | "representative"
  | "customerGroup"
  | "code"
  | "description"
  | "contractGroupName"
  | "priceDate"
  | "startingDate"
  | "endDate"
  | "preference"
  | "sales"
  | "revenue"
  | "mostRecentInvoiceDate"
  | "regionCode"
  | "region";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "role", label: "Role", defaultVisible: true },
  { key: "id", label: "Customer Code", defaultVisible: true },
  { key: "companyName", label: "Customer", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "representative", label: "Representative", defaultVisible: true },
  { key: "customerGroup", label: "Customer Group", defaultVisible: true },
  { key: "code", label: "Contract Code", defaultVisible: true },
  { key: "description", label: "Description", defaultVisible: true },
  { key: "contractGroupName", label: "Contract Group", defaultVisible: true },
  { key: "priceDate", label: "Price Date", defaultVisible: true },
  { key: "startingDate", label: "Starting Date", defaultVisible: true },
  { key: "endDate", label: "End Date", defaultVisible: true },
  { key: "preference", label: "Preference", defaultVisible: true },
  { key: "sales", label: "Sales (kg)", defaultVisible: true },
  { key: "revenue", label: "Revenue", defaultVisible: false },
  {
    key: "mostRecentInvoiceDate",
    label: "Most Recent Invoice Date",
    defaultVisible: false,
  },
  { key: "regionCode", label: "Region Code", defaultVisible: false },
  { key: "region", label: "Region", defaultVisible: false },
];

type Props = { rows: ContractPerCustomerRow[] };

export const ContractsPerCustomerTable = ({ rows }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: ContractPerCustomerRow, key: ColumnKey) => {
    switch (key) {
      case "role":
        return (
          <TableCell key={key}>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {row.role
                ? COMPANY_ROLE_LABELS[
                    row.role as keyof typeof COMPANY_ROLE_LABELS
                  ]
                : "—"}
            </span>
          </TableCell>
        );
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
      case "representative":
        return <TableCell key={key}>—</TableCell>;
      case "customerGroup":
        return <TableCell key={key}>—</TableCell>;
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
      case "priceDate":
        return <TableCell key={key}>{row.priceDate ?? "—"}</TableCell>;
      case "startingDate":
        return <TableCell key={key}>—</TableCell>;
      case "endDate":
        return <TableCell key={key}>—</TableCell>;
      case "preference":
        return (
          <TableCell key={key} className="text-right">
            0
          </TableCell>
        );
      case "sales":
        return (
          <TableCell key={key} className="text-right">
            0
          </TableCell>
        );
      case "revenue":
        return (
          <TableCell key={key} className="text-right">
            0
          </TableCell>
        );
      case "mostRecentInvoiceDate":
        return <TableCell key={key}>—</TableCell>;
      case "regionCode":
        return <TableCell key={key}>—</TableCell>;
      case "region":
        return <TableCell key={key}>—</TableCell>;
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
                  No contracts found for customers or prospects.
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
