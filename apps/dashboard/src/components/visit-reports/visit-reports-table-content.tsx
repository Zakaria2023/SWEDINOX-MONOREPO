"use client";

import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { Paged, TableFilterControl } from "@/lib/table-query";
import Link from "next/link";
import { useState } from "react";
import {
  exportVisitReports,
  VisitReportListItem,
} from "@/app/(dashboard)/visit-reports/actions";
import {
  VISIT_REPORT_COLUMNS,
  VisitReportColumnKey,
} from "@/app/(dashboard)/visit-reports/columns";
import {
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { ResolveVisitReportButton } from "@/components/visit-reports/resolve-visit-report-button";
import { buildColumnVisibility } from "@/lib/helpers";

type ColumnKey = VisitReportColumnKey;

// The column selector and the export read the same declaration — see
// app/(dashboard)/visit-reports/columns.ts — so a column cannot be on screen and
// missing from the file.
const ALL_COLUMNS = selectorColumns(VISIT_REPORT_COLUMNS);

// The columns a header may sort on, matching the keys actions.ts declared.
// A key not named here renders as a plain header.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "customer",
  visitDate: "visitDate",
  createdAt: "createdAt",
};

type VisitReportsTableContentProps = {
  page: Paged<VisitReportListItem>;
  filters: TableFilterControl[];
};

export const VisitReportsTable = ({
  page,
  filters,
}: VisitReportsTableContentProps) => {
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

  const renderCell = (visitReport: VisitReportListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {visitReport.id}
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/visit-reports/${visitReport.uuid}`}
              className="text-primary hover:underline"
            >
              {visitReport.companyName}
            </Link>
          </TableCell>
        );
      case "representative":
        return (
          <TableCell key={key}>
            {visitReport.representative ?? fallbackValue}
          </TableCell>
        );
      case "visitedBy":
        return (
          <TableCell key={key}>
            {visitReport.visitedBy ?? fallbackValue}
          </TableCell>
        );
      case "contactMethod":
        return (
          <TableCell key={key}>
            {visitReport.contactMethod
              ? VISIT_REPORT_CONTACT_METHOD_LABELS[visitReport.contactMethod]
              : fallbackValue}
          </TableCell>
        );
      case "visitDate":
        return (
          <TableCell key={key}>
            {visitReport.visitDate ?? fallbackValue}
          </TableCell>
        );
      case "visitTime":
        return (
          <TableCell key={key}>
            {visitReport.visitTime ?? fallbackValue}
          </TableCell>
        );
      case "hasTakenPlace":
        return (
          <TableCell key={key}>
            {visitReport.hasTakenPlace ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Yes
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                No
              </span>
            )}
          </TableCell>
        );
      case "visitReason":
        return (
          <TableCell key={key}>
            {visitReport.visitReason
              ? VISIT_REPORT_REASON_LABELS[visitReport.visitReason]
              : fallbackValue}
          </TableCell>
        );
      case "contactUuid":
        return (
          <TableCell key={key}>
            {visitReport.contactUuid ?? fallbackValue}
          </TableCell>
        );
      case "attentionPoint":
        return (
          <TableCell key={key}>
            {visitReport.attentionPoint ?? fallbackValue}
          </TableCell>
        );
      case "remarks":
        return (
          <TableCell key={key}>
            {visitReport.remarks ?? fallbackValue}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(visitReport.createdAt).toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search remarks or company…"
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
          fileName="visit-reports"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportVisitReports}
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
              <TableHead data-export-ignore className="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="h-24 text-center"
                >
                  No visit reports found
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((visitReport) => (
                <TableRow key={visitReport.uuid}>
                  {visibleColumns.map((column) =>
                    renderCell(visitReport, column.key),
                  )}
                  <TableCell className="text-right">
                    <ResolveVisitReportButton
                      uuid={visitReport.uuid}
                      hasTakenPlace={visitReport.hasTakenPlace}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        singular="visit report"
        plural="visit reports"
      />
    </div>
  );
};
