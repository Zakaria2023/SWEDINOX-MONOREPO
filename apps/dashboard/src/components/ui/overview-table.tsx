"use client";

import { ReactNode, useState } from "react";
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
import { ExportColumn, selectorColumns } from "@/lib/excel";
import { buildColumnVisibility, cn } from "@/lib/helpers";
import { Paged, SearchParams, TableFilterControl } from "@/lib/table-query";

type Props<T, K extends string> = {
  page: Paged<T>;
  filters: TableFilterControl[];
  /** The screen's whole column declaration, in the reference's order. */
  columns: readonly ExportColumn<T, K>[];
  /** Column key → the sort key its action accepts. */
  sortable?: Partial<Record<K, string>>;
  rowKey: (row: T) => string;
  /**
   * A cell the declaration cannot draw on its own — a link, a badge. Return
   * `undefined` to fall back to the column's export value.
   */
  renderCell?: (row: T, key: K) => ReactNode | undefined;
  exportAction: (params: SearchParams, columnKeys: string[]) => Promise<string>;
  fileName: string;
  searchPlaceholder?: string;
  emptyText: string;
  singular: string;
  plural: string;
  /** Buttons that act on the view, beside the selector. */
  toolbar?: ReactNode;
  /**
   * Buttons that act on one row, the way every reference toolbar does: they
   * sit above the grid and wake when a row is selected. Passing this makes
   * rows selectable by clicking them.
   */
  selectionToolbar?: (selected: T | null) => ReactNode;
};

/**
 * A reference overview: every column the reference prints, chosen with the
 * column selector, sorted, filtered, paged and exported — with one
 * declaration (`columns.ts`) behind all four, so a column cannot be on screen
 * and missing from the export.
 *
 * Most cells are the column's own export value, drawn by `ExportValueCell`;
 * `renderCell` overrides the few that link somewhere.
 */
export const OverviewTable = <T, K extends string>({
  page,
  filters,
  columns,
  sortable = {},
  rowKey,
  renderCell,
  exportAction,
  fileName,
  searchPlaceholder,
  emptyText,
  singular,
  plural,
  toolbar,
  selectionToolbar,
}: Props<T, K>) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected =
    page.rows.find((row) => rowKey(row) === selectedKey) ?? null;
  const selectable = selectorColumns(columns);
  const [visibility, setVisibility] = useState<Record<K, boolean>>(
    buildColumnVisibility(selectable),
  );

  const toggle = (key: string) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key as K] }));

  const visible = columns.filter((col) => visibility[col.key]);

  const cell = (row: T, col: ExportColumn<T, K>) => {
    const custom = renderCell?.(row, col.key);
    if (custom !== undefined) {
      return <TableCell key={col.key}>{custom}</TableCell>;
    }
    return <ExportValueCell key={col.key} value={col.value(row)} />;
  };

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder={searchPlaceholder} filters={filters}>
        {toolbar}
        <ColumnSelector
          columns={selectable}
          visibility={visibility}
          onToggle={toggle}
        />
        <PagedTableExportButton
          fileName={fileName}
          action={exportAction}
          columnKeys={visible.map((col) => col.key)}
        />
      </TableToolbar>
      {selectionToolbar && selectionToolbar(selected)}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visible.map((col) => {
                const sortKey = sortable[col.key];
                return sortKey ? (
                  <TableSortHeader key={col.key} sortKey={sortKey}>
                    {col.label}
                  </TableSortHeader>
                ) : (
                  <TableHead key={col.key} className="whitespace-nowrap">
                    {col.label}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(visible.length, 1)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((row) => {
                const key = rowKey(row);
                return selectionToolbar ? (
                  <TableRow
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={cn(
                      "cursor-pointer",
                      key === selectedKey && "bg-accent",
                    )}
                  >
                    {visible.map((col) => cell(row, col))}
                  </TableRow>
                ) : (
                  <TableRow key={key}>
                    {visible.map((col) => cell(row, col))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} singular={singular} plural={plural} />
    </div>
  );
};
