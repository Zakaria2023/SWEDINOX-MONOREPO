"use client";

import Link from "next/link";
import {
  exportContracts,
  ContractListItem,
} from "@/app/(dashboard)/contracts/actions";
import {
  CONTRACT_COLUMNS,
  ContractColumnKey,
} from "@/app/(dashboard)/contracts/columns";
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
import { Paged, TableFilterControl } from "@/lib/table-query";
import { buildColumnVisibility } from "@/lib/helpers";
import { CONTRACT_TYPE_LABELS } from "@/lib/labels";
import { useState } from "react";

type ColumnKey = ContractColumnKey;

// The column selector and the export read the same declaration — see
// app/(dashboard)/contracts/columns.ts — so a column cannot be on screen and
// missing from the file.
const ALL_COLUMNS = selectorColumns(CONTRACT_COLUMNS);

// The columns a header may sort on, matching the keys actions.ts declared.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  // The "Code" column renders contract.code, so it sorts by that rather than
  // by the id it is keyed under.
  id: "code",
  contractType: "contractType",
  contractGroupName: "contractGroup",
  createdAt: "createdAt",
};

type ContractsTableContentProps = {
  page: Paged<ContractListItem>;
  filters: TableFilterControl[];
};

export const ContractsTable = ({
  page,
  filters,
}: ContractsTableContentProps) => {
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
  const fallbackValue = "—";

  const renderCell = (contract: ContractListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/contracts/${contract.uuid}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {contract.code}
            </Link>
          </TableCell>
        );
      case "contractType":
        return (
          <TableCell key={key}>
            {contract.contractType
              ? CONTRACT_TYPE_LABELS[contract.contractType]
              : fallbackValue}
          </TableCell>
        );
      case "contractGroupName":
        return (
          <TableCell key={key}>
            {contract.contractGroupName ?? fallbackValue}
          </TableCell>
        );
      case "description":
        return <TableCell key={key}>{contract.description}</TableCell>;
      case "searchCode1":
        return (
          <TableCell key={key}>
            {contract.searchCode1 ?? fallbackValue}
          </TableCell>
        );
      case "searchCode2":
        return (
          <TableCell key={key}>
            {contract.searchCode2 ?? fallbackValue}
          </TableCell>
        );
      case "searchCode3":
        return (
          <TableCell key={key}>
            {contract.searchCode3 ?? fallbackValue}
          </TableCell>
        );
      case "websiteSorting":
        return (
          <TableCell key={key}>
            {contract.websiteSorting ?? fallbackValue}
          </TableCell>
        );
      case "hideOnWebsite":
        return (
          <TableCell key={key}>
            {contract.hideOnWebsite ? (
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
      <TableToolbar
        searchPlaceholder="Search code, description or group…"
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
        <PagedTableExportButton
          fileName="contracts"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportContracts}
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
                  No contracts found
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((contract) => (
                <TableRow key={contract.id}>
                  {visibleColumns.map((column) =>
                    renderCell(contract, column.key),
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} singular="contract" plural="contracts" />
    </div>
  );
};
