"use client";

import { useState } from "react";
import {
  ContractPerCustomerRow,
  exportContractsPerCustomer,
} from "@/app/(dashboard)/contracts/actions";
import {
  CONTRACT_PER_CUSTOMER_COLUMNS,
  ContractPerCustomerColumnKey,
} from "@/app/(dashboard)/contracts-per-customer/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { ExportValueCell } from "@/components/ui/export-value-cell";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  customerGroupLabel,
  formatDateValue,
  orDash,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { COMPANY_ROLE_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = ContractPerCustomerColumnKey;

type Props = {
  page: Paged<ContractPerCustomerRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(CONTRACT_PER_CUSTOMER_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "companyName",
  companyCode: "companyCode",
  code: "code",
  startingDate: "startingDate",
};

export const ContractsPerCustomerTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

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
            {row.role ? COMPANY_ROLE_LABELS[row.role] : "—"}
          </TableCell>
        );
      case "companyCode":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.id}
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {orDash(row.companyName)}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "customerGroup":
        return (
          <TableCell key={key}>
            {customerGroupLabel(row.customerGroup)}
          </TableCell>
        );
      case "code":
        return (
          <TableCell key={key} className="font-medium">
            {orDash(row.code)}
          </TableCell>
        );
      case "description":
        return <TableCell key={key}>{orDash(row.description)}</TableCell>;
      case "contractGroupName":
        return <TableCell key={key}>{orDash(row.contractGroupName)}</TableCell>;
      case "priceDate":
        return (
          <TableCell key={key}>{formatDateValue(row.priceDate)}</TableCell>
        );
      case "startingDate":
        return (
          <TableCell key={key}>{formatDateValue(row.startingDate)}</TableCell>
        );
      case "endDate":
        return <TableCell key={key}>{formatDateValue(row.endDate)}</TableCell>;
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      default: {
        const column = CONTRACT_PER_CUSTOMER_COLUMNS.find((col) => col.key === key);
        return (
          <ExportValueCell key={key} value={column ? column.value(row) : null} />
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search company or contract…"
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
          fileName="contracts-per-customer"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportContractsPerCustomer}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No contracts linked</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A contract marked <em>Link to new customer</em> is attached to every
            customer and prospect created after it. Try clearing the search or
            the filters.
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
                {page.rows.map((row, index) => (
                  <TableRow key={`${row.id}-${row.code}-${index}`}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="contract" plural="contracts" />
        </>
      )}
    </div>
  );
};
