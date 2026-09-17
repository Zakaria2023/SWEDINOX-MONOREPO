"use client";

import Link from "next/link";
import {
  CommunicationSettingListItem,
  exportCommunicationSettings,
} from "@/app/(dashboard)/communication-settings/actions";
import {
  COMMUNICATION_SETTING_COLUMNS,
  CommunicationSettingColumnKey,
} from "@/app/(dashboard)/communication-settings/columns";
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
import { buildColumnVisibility, formatDateColumn } from "@/lib/helpers";
import {
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = CommunicationSettingColumnKey;

type Props = {
  page: Paged<CommunicationSettingListItem>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(COMMUNICATION_SETTING_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  companyName: "company",
  documentType: "documentType",
};

const fallback = "—";

export const CommunicationSettingsTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: CommunicationSettingListItem, key: ColumnKey) => {
    switch (key) {
      case "createdAt":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.createdAt)}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.updatedAt)}
          </TableCell>
        );
      case "modifiedBy":
        return <TableCell key={key}>{row.modifiedBy ?? fallback}</TableCell>;
      case "companyId":
        return (
          <TableCell key={key} className="text-right">
            {row.companyId ?? fallback}
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {row.companyUuid ? (
              <Link
                href={`/companies/${row.companyUuid}`}
                className="text-primary hover:underline"
              >
                {row.companyName ?? fallback}
              </Link>
            ) : (
              (row.companyName ?? fallback)
            )}
          </TableCell>
        );
      case "documentType":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/communication-settings/${row.id}`}
              className="text-primary hover:underline"
            >
              {COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[row.documentType]}
            </Link>
          </TableCell>
        );
      case "communicationType":
        return (
          <TableCell key={key}>
            {COMMUNICATION_SETTING_TYPE_LABELS[row.communicationType]}
          </TableCell>
        );
      case "shape":
        return (
          <TableCell key={key}>
            {row.shape
              ? COMMUNICATION_SETTING_SHAPE_LABELS[row.shape]
              : fallback}
          </TableCell>
        );
      case "contactName":
        return (
          <TableCell key={key}>{row.contactName ?? fallback}</TableCell>
        );
      case "contactEmail":
        return (
          <TableCell key={key}>
            {(row.contactUuid ? row.contactEmail : null) ?? fallback}
          </TableCell>
        );
      case "customContact":
        return (
          <TableCell key={key}>
            {(row.contactUuid ? null : row.email) ?? fallback}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder="Search company or address…" filters={filters}>
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="communication-settings"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportCommunicationSettings}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No communication settings</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A setting overrides how one document reaches one company. Everything
            without one is sent the usual way.
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
                <TableRow key={row.id}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="communication setting"
            plural="communication settings"
          />
        </>
      )}
    </div>
  );
};
