"use client";

import Link from "next/link";
import {
  ComplaintLineOverviewRow,
  exportComplaintLines,
} from "@/app/(dashboard)/complaint-lines/actions";
import {
  COMPLAINT_LINE_COLUMNS,
  ComplaintLineColumnKey,
} from "@/app/(dashboard)/complaint-lines/columns";
import { ComplaintOverviewCell } from "@/components/complaints/complaint-overview-cell";
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
import { buildColumnVisibility } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type Props = {
  page: Paged<ComplaintLineOverviewRow>;
  filters: TableFilterControl[];
};

type LineCellProps = {
  row: ComplaintLineOverviewRow;
  column: ComplaintLineColumnKey;
};

const ALL_COLUMNS = selectorColumns(COMPLAINT_LINE_COLUMNS);

const SORTABLE: Partial<Record<ComplaintLineColumnKey, string>> = {
  complaintNumber: "complaintNumber",
  reportDate: "reportDate",
  companyName: "customer",
  status: "status",
  deadline: "deadline",
  creationDate: "createdAt",
};

const LineCell = ({ row, column }: LineCellProps) => {
  switch (column) {
    case "orderLine":
      return (
        <TableCell className="text-right">
          <Link
            href={`/complaint-lines/${row.lineUuid}`}
            className="text-primary hover:underline"
          >
            {row.orderLine ?? "—"}
          </Link>
        </TableCell>
      );
    case "warehouseSection":
      return <TableCell>{row.warehouseSection ?? "—"}</TableCell>;
    default:
      return <ComplaintOverviewCell row={row} column={column} />;
  }
};

export const ComplaintLinesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ComplaintLineColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ComplaintLineColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search description, customer or product…"
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
          fileName="complaint-lines"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportComplaintLines}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No complaint lines match this view</p>
          <p className="max-w-md text-sm text-muted-foreground">
            An order complaint gets its lines on the complaint itself: open it
            and add the delivered order lines it is about.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((col) => {
                  const sortKey = SORTABLE[col.key];
                  return sortKey ? (
                    <TableSortHeader key={col.key} sortKey={sortKey}>
                      {col.label}
                    </TableSortHeader>
                  ) : (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow key={row.lineUuid}>
                  {visibleColumns.map((col) => (
                    <LineCell key={col.key} row={row} column={col.key} />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="complaint line"
            plural="complaint lines"
          />
        </>
      )}
    </div>
  );
};
