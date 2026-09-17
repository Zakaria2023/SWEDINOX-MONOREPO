"use client";

import Link from "next/link";
import {
  exportVisitsMade,
  VisitMadeRow,
} from "@/app/(dashboard)/visits-made/actions";
import {
  VISIT_MADE_COLUMNS,
  VisitMadeColumnKey,
} from "@/app/(dashboard)/visits-made/columns";
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
  formatDateColumn,
  orDash,
  visitReasonsLabel,
  yesNo,
} from "@/lib/helpers";
import {
  CUSTOMER_GROUP_LABELS,
  VISIT_REPORT_CATEGORY_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = VisitMadeColumnKey;

type Props = {
  page: Paged<VisitMadeRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(VISIT_MADE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  visitDate: "visitDate",
  companyName: "company",
  customerCode: "customerCode",
};

export const VisitsMadeTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: VisitMadeRow, key: ColumnKey) => {
    switch (key) {
      case "representative":
        return <TableCell key={key}>{orDash(row.representative)}</TableCell>;
      case "customerCode":
        return <TableCell key={key}>{orDash(row.customerCode)}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {row.companyUuid ? (
              <Link
                href={`/companies/${row.companyUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.companyName)}
              </Link>
            ) : (
              orDash(row.companyName)
            )}
          </TableCell>
        );
      case "postalCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.postalCode)}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "visitDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            <Link
              href={`/visit-reports/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {formatDateColumn(row.visitDate)}
            </Link>
          </TableCell>
        );
      case "visitTime":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.visitTime)}
          </TableCell>
        );
      case "visitedBy":
        return <TableCell key={key}>{orDash(row.visitedBy)}</TableCell>;
      case "contactPerson":
        return (
          <TableCell key={key}>
            {orDash(
              [row.contactFirstName, row.contactLastName]
                .filter(Boolean)
                .join(" ") || null,
            )}
          </TableCell>
        );
      case "categories":
        return (
          <TableCell key={key}>
            {orDash(
              row.categories && row.categories.length > 0
                ? row.categories
                    .map((category) => VISIT_REPORT_CATEGORY_LABELS[category])
                    .join(", ")
                : null,
            )}
          </TableCell>
        );
      case "contactMethod":
        return (
          <TableCell key={key}>
            {orDash(
              row.contactMethod
                ? VISIT_REPORT_CONTACT_METHOD_LABELS[row.contactMethod]
                : null,
            )}
          </TableCell>
        );
      case "hasTakenPlace":
        return <TableCell key={key}>{yesNo(row.hasTakenPlace)}</TableCell>;
      case "visitReasons":
        return (
          <TableCell key={key}>
            {orDash(visitReasonsLabel(row.visitReasons))}
          </TableCell>
        );
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "customerGroup":
        return (
          <TableCell key={key}>
            {orDash(
              row.customerGroup
                ? CUSTOMER_GROUP_LABELS[row.customerGroup]
                : null,
            )}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder="Search company…" filters={filters}>
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="visits-made"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportVisitsMade}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No visits recorded</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Visits and calls appear here once a representative writes one up,
            whether or not it took place.
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
                <TableRow key={row.uuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} singular="visit" plural="visits" />
        </>
      )}
    </div>
  );
};
