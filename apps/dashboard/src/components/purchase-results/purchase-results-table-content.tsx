"use client";

import {
  exportPurchaseResults,
  PurchaseResultRow,
} from "@/app/(dashboard)/purchase-results/actions";
import {
  PURCHASE_RESULT_COLUMNS,
  PurchaseResultColumnKey,
} from "@/app/(dashboard)/purchase-results/columns";
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
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = PurchaseResultColumnKey;

type Props = {
  page: Paged<PurchaseResultRow>;
  filters: TableFilterControl[];
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(PURCHASE_RESULT_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  productCode: "productCode",
  receiptDate: "receiptDate",
  purchaseValue: "purchaseValue",
  replacementValue: "replacementValue",
};

export const PurchaseResultsTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: PurchaseResultRow, key: ColumnKey) => {
    switch (key) {
      case "mainGroup":
        return <TableCell key={key}>{row.mainGroup ?? "—"}</TableCell>;
      case "subgroup":
        return <TableCell key={key}>{row.subgroup ?? "—"}</TableCell>;
      case "productCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            {row.productCode ?? "—"}
          </TableCell>
        );
      case "productName":
        return <TableCell key={key}>{row.productName ?? "—"}</TableCell>;
      case "year":
        return (
          <TableCell key={key} className="text-right">
            {row.year ?? "—"}
          </TableCell>
        );
      case "month":
        return (
          <TableCell key={key} className="text-right">
            {row.month ?? "—"}
          </TableCell>
        );
      case "receiptDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.receiptDate)}
          </TableCell>
        );
      case "purchaseValue":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(row.purchaseValue)}
          </TableCell>
        );
      case "replacementValue":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {row.replacementValue === null
              ? "—"
              : formatMoney(row.replacementValue)}
          </TableCell>
        );
      case "purchaseMinusReplacement":
        return (
          <TableCell
            key={key}
            className={cn(
              "text-right whitespace-nowrap",
              // Bought above what it would cost today: the result went the
              // wrong way, and that is the figure this screen exists to show.
              row.purchaseMinusReplacement !== null &&
                row.purchaseMinusReplacement > 0 &&
                "text-amber-700",
            )}
          >
            {row.purchaseMinusReplacement === null
              ? "—"
              : formatMoney(row.purchaseMinusReplacement)}
          </TableCell>
        );
      case "purchaseMinusReplacementPercent":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {row.purchaseMinusReplacementPercent === null
              ? "—"
              : `${formatNumber(row.purchaseMinusReplacementPercent)}%`}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product or group…"
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
          fileName="purchase-results"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportPurchaseResults}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No purchase results match this view</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A row appears here for every reception goods actually arrived on.
            Widen the receipt date or clear the filters to see more.
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
          <TablePagination
            page={page}
            singular="purchase result"
            plural="purchase results"
          />
        </>
      )}
    </div>
  );
};
