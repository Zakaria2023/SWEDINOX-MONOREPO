"use client";

import { ContractListItem } from "@/app/(dashboard)/contracts/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { COMMON_TEXT, CONTRACT_TYPE_LABELS } from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "contractType"
  | "contractGroupName"
  | "description"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "websiteSorting"
  | "hideOnWebsite"
  | "createdAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "Code", defaultVisible: true },
  { key: "contractType", label: "Contract Type", defaultVisible: true },
  { key: "contractGroupName", label: "Contract Group", defaultVisible: true },
  { key: "description", label: "Description", defaultVisible: true },
  { key: "searchCode1", label: "Search Code 1", defaultVisible: false },
  { key: "searchCode2", label: "Search Code 2", defaultVisible: false },
  { key: "searchCode3", label: "Search Code 3", defaultVisible: false },
  { key: "websiteSorting", label: "Website Sort", defaultVisible: false },
  { key: "hideOnWebsite", label: "Hide on Website", defaultVisible: false },
  { key: "createdAt", label: "Created At", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type ContractsTableContentProps = {
  contracts: ContractListItem[];
};

export const ContractsTableContent = ({ contracts }: ContractsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const fallbackValue = COMMON_TEXT.notAvailable;

  const renderCell = (contract: ContractListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium">{contract.id}</TableCell>;
      case "contractType":
        return (
          <TableCell key={key}>
            {contract.contractType
              ? CONTRACT_TYPE_LABELS[contract.contractType]
              : fallbackValue}
          </TableCell>
        );
      case "contractGroupName":
        return <TableCell key={key}>{contract.contractGroupName ?? fallbackValue}</TableCell>;
      case "description":
        return <TableCell key={key}>{contract.description}</TableCell>;
      case "searchCode1":
        return <TableCell key={key}>{contract.searchCode1 ?? fallbackValue}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{contract.searchCode2 ?? fallbackValue}</TableCell>;
      case "searchCode3":
        return <TableCell key={key}>{contract.searchCode3 ?? fallbackValue}</TableCell>;
      case "websiteSorting":
        return <TableCell key={key}>{contract.websiteSorting ?? fallbackValue}</TableCell>;
      case "hideOnWebsite":
        return (
          <TableCell key={key}>
            {contract.hideOnWebsite ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {COMMON_TEXT.yes}
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {COMMON_TEXT.no}
              </span>
            )}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(contract.createdAt).toLocaleDateString()}
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
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No contracts found
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  {visibleColumns.map((column) => renderCell(contract, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
