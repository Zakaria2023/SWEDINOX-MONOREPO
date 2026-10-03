"use client";

import {
  ComplaintListItem,
  exportComplaints,
} from "@/app/(dashboard)/complaints/actions";
import {
  COMPLAINT_COLUMNS,
  ComplaintColumnKey,
} from "@/app/(dashboard)/complaints/columns";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TableNewLink } from "@/components/ui/table-new-link";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { buildColumnVisibility } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";
import { ComplaintOverviewCell } from "./complaint-overview-cell";

type Props = {
  page: Paged<ComplaintListItem>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(COMPLAINT_COLUMNS);

const SORTABLE: Partial<Record<ComplaintColumnKey, string>> = {
  complaintNumber: "complaintNumber",
  reportDate: "reportDate",
  companyName: "customer",
  status: "status",
  deadline: "deadline",
  creationDate: "createdAt",
};

export const ComplaintsTableContent = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ComplaintColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ComplaintColumnKey],
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
          fileName="complaints"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportComplaints}
        />
        <TableNewLink href="/complaints/new">New Complaint</TableNewLink>
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No complaints match this view</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Record a complaint with New Complaint, or clear the search and the
            filters to see more.
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
                <TableRow key={row.complaintUuid}>
                  {visibleColumns.map((col) => (
                    <ComplaintOverviewCell
                      key={col.key}
                      row={row}
                      column={col.key}
                    />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="complaint"
            plural="complaints"
          />
        </>
      )}
    </div>
  );
};
