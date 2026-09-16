"use client";

import { SoldProductNotAdvisedRow } from "@/app/(dashboard)/sold-products-not-advised/actions";
import {
  SOLD_PRODUCT_NOT_ADVISED_COLUMNS,
  SoldProductNotAdvisedColumnKey,
} from "@/app/(dashboard)/sold-products-not-advised/columns";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { TableExportButton } from "@/components/ui/table-export-button";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import { useState } from "react";

type ColumnKey = SoldProductNotAdvisedColumnKey;

type Props = {
  rows: SoldProductNotAdvisedRow[];
};

// The column selector and the export read the same declaration — see
// app/(dashboard)/sold-products-not-advised/columns.ts — so a column cannot be
// on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(SOLD_PRODUCT_NOT_ADVISED_COLUMNS);

export const SoldProductsNotAdvisedTable = ({ rows }: Props) => {
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

  const renderCell = (row: SoldProductNotAdvisedRow, key: ColumnKey) => {
    switch (key) {
      case "mainGroup":
        return <TableCell key={key}>{row.mainGroup ?? "—"}</TableCell>;
      case "productGroup":
        return <TableCell key={key}>{row.productGroup ?? "—"}</TableCell>;
      case "productCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            {row.productCode}
          </TableCell>
        );
      case "productName":
        return <TableCell key={key}>{row.productName}</TableCell>;
      case "stockProduct":
        return (
          <TableCell key={key} className="text-center">
            <Checkbox checked={row.stockProduct ?? false} disabled />
          </TableCell>
        );
      case "standardProduct":
        return (
          <TableCell key={key} className="text-center">
            <Checkbox checked={row.standardProduct ?? false} disabled />
          </TableCell>
        );
      case "avgMonthlyConsumption":
        return (
          <TableCell key={key} className="text-right">
            {row.avgMonthlyConsumption === null
              ? "—"
              : formatNumber(row.avgMonthlyConsumption)}
          </TableCell>
        );
      case "revenue":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(row.revenue)}
          </TableCell>
        );
      case "sales":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.sales)}
          </TableCell>
        );
      case "stock":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.stock)}
          </TableCell>
        );
      case "available":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.available)}
          </TableCell>
        );
      case "stockUnit":
        return <TableCell key={key}>{row.stockUnit ?? "—"}</TableCell>;
      case "pacClassification":
        return <TableCell key={key}>{row.pacClassification ?? "—"}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-2">
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <TableExportButton
          tableId="sold-products-not-advised-table"
          fileName="sold-products-not-advised"
          sheetName="Sold products not on the order recommendation"
        />
      </div>

      <Table id="sold-products-not-advised-table">
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No sold products outside the order recommendation.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.productUuid}>
                {visibleColumns.map((column) => renderCell(row, column.key))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
