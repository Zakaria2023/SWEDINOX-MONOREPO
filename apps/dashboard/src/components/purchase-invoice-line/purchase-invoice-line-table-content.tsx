"use client";

import Link from "next/link";
import {
  exportPurchaseInvoiceLines,
  PurchaseInvoiceLineRow,
  PurchaseInvoiceLinesPage,
  PurchaseInvoiceLineTotals,
} from "@/app/(dashboard)/purchase-invoice-line/actions";
import {
  PURCHASE_INVOICE_LINE_COLUMNS,
  PurchaseInvoiceLineColumnKey,
} from "@/app/(dashboard)/purchase-invoice-line/columns";
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
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = PurchaseInvoiceLineColumnKey;

type TotalKey = "weightKg" | "quantity" | "amount";

type Props = {
  page: PurchaseInvoiceLinesPage;
  filters: TableFilterControl[];
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(PURCHASE_INVOICE_LINE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  year: "invoiceDate",
  commodityCode: "commodityCode",
  supplierName: "supplier",
  productCode: "productCode",
};

const RIGHT_ALIGNED: Partial<Record<ColumnKey, true>> = {
  month: true,
  lineNumber: true,
  weightKg: true,
  quantity: true,
  amount: true,
  invoiceId: true,
};

// The three columns the footer sums, over every line the view matches.
const TOTAL_KEYS: Record<TotalKey, true> = {
  weightKg: true,
  quantity: true,
  amount: true,
};

const isTotalKey = (key: ColumnKey): key is TotalKey => key in TOTAL_KEYS;

const renderTotal = (totals: PurchaseInvoiceLineTotals, key: TotalKey) => {
  if (key === "amount") {
    return formatMoney(totals.amount);
  }
  if (key === "weightKg") {
    return formatNumber(totals.weightKg);
  }
  return formatNumber(totals.quantity);
};

export const PurchaseInvoiceLineTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const columnCount = Math.max(visibleColumns.length, 1);

  // Where the totals start. Everything to the left of it carries the caption,
  // so the sums stay under the columns they belong to however few are on show.
  const firstTotalIndex = visibleColumns.findIndex((col) =>
    isTotalKey(col.key),
  );

  const captionSpan =
    firstTotalIndex === -1 ? visibleColumns.length : firstTotalIndex;

  const totalColumns =
    firstTotalIndex === -1 ? [] : visibleColumns.slice(firstTotalIndex);

  const caption = `Total, all ${formatNumber(page.total)} lines`;

  const renderCell = (row: PurchaseInvoiceLineRow, key: ColumnKey) => {
    switch (key) {
      case "year":
        return <TableCell key={key}>{row.year ?? "—"}</TableCell>;
      case "month":
        return (
          <TableCell key={key} className="text-right">
            {row.month ?? "—"}
          </TableCell>
        );
      case "purchaseOrder":
        return (
          <TableCell key={key}>
            {row.purchaseOrderId ?? row.purchaseOrderNumber ?? "—"}
          </TableCell>
        );
      case "lineNumber":
        return (
          <TableCell key={key} className="text-right">
            {row.lineNumber ?? "—"}
          </TableCell>
        );
      case "commodityCode":
        return <TableCell key={key}>{row.commodityCode ?? "—"}</TableCell>;
      case "country":
        return <TableCell key={key}>{row.country ?? "—"}</TableCell>;
      case "weightKg":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.weightKg)}
          </TableCell>
        );
      case "quantity":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(Number(row.quantity))}
          </TableCell>
        );
      case "amount":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(row.amount)}
          </TableCell>
        );
      case "vatNumber":
        return <TableCell key={key}>{row.vatNumber ?? "—"}</TableCell>;
      case "invoiceId":
        return (
          <TableCell key={key} className="text-right font-medium">
            <Link
              href={`/purchase-invoice-line/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {row.invoiceId}
            </Link>
          </TableCell>
        );
      case "supplierName":
        return <TableCell key={key}>{row.supplierName ?? "—"}</TableCell>;
      case "productCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {row.productCode ?? "—"}
          </TableCell>
        );
      case "productName":
        return <TableCell key={key}>{row.productName ?? "—"}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product, CBS no. or supplier…"
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
          fileName="purchase-invoice-line"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportPurchaseInvoiceLines}
        />
      </TableToolbar>
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
                <TableHead
                  key={col.key}
                  className={RIGHT_ALIGNED[col.key] ? "text-right" : undefined}
                >
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
                colSpan={columnCount}
                className="h-24 text-center text-muted-foreground"
              >
                No purchase invoice lines found.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {page.rows.map((row) => (
                <TableRow key={row.uuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
              {captionSpan === 0 && visibleColumns.length > 0 && (
                // A sum column is the leftmost one on show, so the caption has
                // no room beside it and takes a line of its own.
                <TableRow className="font-semibold">
                  <TableCell colSpan={columnCount}>{caption}</TableCell>
                </TableRow>
              )}
              {visibleColumns.length > 0 && (
                <TableRow className="font-semibold">
                  {captionSpan > 0 && (
                    <TableCell colSpan={captionSpan}>{caption}</TableCell>
                  )}
                  {totalColumns.map((col) =>
                    isTotalKey(col.key) ? (
                      <TableCell
                        key={col.key}
                        className="text-right whitespace-nowrap"
                      >
                        {renderTotal(page.totals, col.key)}
                      </TableCell>
                    ) : (
                      <TableCell key={col.key} />
                    ),
                  )}
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        singular="purchase invoice line"
        plural="purchase invoice lines"
      />
    </div>
  );
};
