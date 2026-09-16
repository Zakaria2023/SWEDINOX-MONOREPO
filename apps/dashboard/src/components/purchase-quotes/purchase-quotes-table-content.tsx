"use client";

import Link from "next/link";
import {
  exportPurchaseQuoteLines,
  PurchaseQuoteLineRow,
} from "@/app/(dashboard)/purchase-quotes/actions";
import {
  PURCHASE_QUOTE_LINE_COLUMNS,
  PurchaseQuoteLineColumnKey,
} from "@/app/(dashboard)/purchase-quotes/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { StatusBadge } from "@/components/ui/status-badge";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatDateColumn,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import {
  PURCHASE_QUOTE_EXPIRATION_REASON_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = PurchaseQuoteLineColumnKey;

type Props = {
  page: Paged<PurchaseQuoteLineRow>;
  filters: TableFilterControl[];
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(PURCHASE_QUOTE_LINE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  supplierName: "supplier",
  quoteDate: "quoteDate",
  validUntil: "validUntil",
  quoteId: "quote",
};

const RIGHT_ALIGNED: Partial<Record<ColumnKey, true>> = {
  lineNumber: true,
  lengthMm: true,
  widthMm: true,
  quantity: true,
  kg: true,
  netPrice: true,
  amount: true,
  companyCode: true,
};

const numberOrDash = (value: string | number | null): string =>
  value === null ? "—" : formatNumber(Number(value));

const moneyOrDash = (value: string | number | null): string =>
  value === null ? "—" : formatMoney(Number(value));

export const PurchaseQuotesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: PurchaseQuoteLineRow, key: ColumnKey) => {
    switch (key) {
      case "supplierName":
        return <TableCell key={key}>{row.supplierName ?? "—"}</TableCell>;
      case "quoteDate":
        return <TableCell key={key}>{formatDateColumn(row.quoteDate)}</TableCell>;
      case "validUntil":
        return (
          <TableCell key={key}>{formatDateColumn(row.validUntil)}</TableCell>
        );
      case "quoteNumber":
        return <TableCell key={key}>{row.quoteNumber ?? "—"}</TableCell>;
      case "quoteId":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/purchase-quotes/${row.quoteUuid}`}
              className="text-primary hover:underline"
            >
              {row.quoteId}
            </Link>
          </TableCell>
        );
      case "lineNumber":
        return (
          <TableCell key={key} className="text-right">
            {row.lineNumber ?? "—"}
          </TableCell>
        );
      case "status":
        return (
          <TableCell key={key}>
            <StatusBadge
              value={row.status}
              label={PURCHASE_QUOTE_STATUS_LABELS[row.status]}
            />
          </TableCell>
        );
      case "expirationReason":
        return (
          <TableCell key={key}>
            {row.expirationReason
              ? PURCHASE_QUOTE_EXPIRATION_REASON_LABELS[row.expirationReason]
              : "—"}
          </TableCell>
        );
      case "revenueGroupNumber":
        return <TableCell key={key}>{row.revenueGroupNumber ?? "—"}</TableCell>;
      case "revenueGroupName":
        return <TableCell key={key}>{row.revenueGroupName ?? "—"}</TableCell>;
      case "productCode":
        return <TableCell key={key}>{row.productCode ?? "—"}</TableCell>;
      case "productDescription":
        return (
          <TableCell key={key}>{row.productDescription ?? "—"}</TableCell>
        );
      case "lengthMm":
        return (
          <TableCell key={key} className="text-right">
            {numberOrDash(row.lengthMm)}
          </TableCell>
        );
      case "widthMm":
        return (
          <TableCell key={key} className="text-right">
            {numberOrDash(row.widthMm)}
          </TableCell>
        );
      case "quantity":
        return (
          <TableCell key={key} className="text-right">
            {numberOrDash(row.quantity)}
          </TableCell>
        );
      case "unit":
        return (
          <TableCell key={key}>
            {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
          </TableCell>
        );
      case "kg":
        return (
          <TableCell key={key} className="text-right">
            {numberOrDash(row.kg)}
          </TableCell>
        );
      case "netPrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {moneyOrDash(row.netPrice)}
          </TableCell>
        );
      case "priceUnit":
        return <TableCell key={key}>{row.priceUnit ?? "—"}</TableCell>;
      case "amount":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {moneyOrDash(row.amount)}
          </TableCell>
        );
      case "companyCode":
        return (
          <TableCell key={key} className="text-right">
            {row.companyCode ?? "—"}
          </TableCell>
        );
      case "internalText":
        return <TableCell key={key}>{row.internalText ?? "—"}</TableCell>;
      case "isConsignment":
        return (
          <TableCell key={key}>{row.isConsignment ? "Yes" : "No"}</TableCell>
        );
      case "purchaserInitials":
        return <TableCell key={key}>{row.purchaserInitials ?? "—"}</TableCell>;
      case "purchaser":
        return <TableCell key={key}>{row.purchaser ?? "—"}</TableCell>;
      case "ourReference":
        return <TableCell key={key}>{row.ourReference ?? "—"}</TableCell>;
      case "purchaseReference":
        return <TableCell key={key}>{row.purchaseReference ?? "—"}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product, supplier or quote no…"
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
          fileName="purchase-quotes"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportPurchaseQuoteLines}
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
                colSpan={Math.max(visibleColumns.length, 1)}
                className="h-24 text-center text-muted-foreground"
              >
                No purchase quotes found.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row) => (
              <TableRow key={row.lineUuid ?? row.quoteUuid}>
                {visibleColumns.map((col) => renderCell(row, col.key))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} singular="quote line" plural="quote lines" />
    </div>
  );
};
