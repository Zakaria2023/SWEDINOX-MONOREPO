"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportRemarksPerCompany,
  RemarkPerCompanyRow,
} from "@/app/(dashboard)/remarks-per-company/actions";
import {
  REMARK_PER_COMPANY_COLUMNS,
  RemarkPerCompanyColumnKey,
} from "@/app/(dashboard)/remarks-per-company/columns";
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
import {
  buildColumnVisibility,
  orDash,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = RemarkPerCompanyColumnKey;

type Props = {
  page: Paged<RemarkPerCompanyRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(REMARK_PER_COMPANY_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyCode: "companyCode",
  customer: "customer",
};

export const RemarksPerCompanyTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: RemarkPerCompanyRow, key: ColumnKey) => {
    switch (key) {
      case "companyCode":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.companyCode}
          </TableCell>
        );
      case "customer":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/companies/${row.companyUuid}`}
              className="text-primary hover:underline"
            >
              {orDash(row.customer)}
            </Link>
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
      case "remarks":
        // A remark is a paragraph, not a cell: kept wrapping so it can be read
        // rather than clipped.
        return (
          <TableCell key={key} className="max-w-md whitespace-pre-wrap">
            {row.remarks}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search company or remark…"
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
          fileName="remarks-per-company"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportRemarksPerCompany}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No company remarks</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A company appears here once somebody writes a remark on it. Try
            clearing the search or the filter.
          </p>
        </div>
      ) : (
        <>
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
              {page.rows.map((row) => (
                <TableRow key={row.companyUuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} singular="remark" plural="remarks" />
        </>
      )}
    </div>
  );
};
