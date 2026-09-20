"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportInvoiceLines,
  InvoiceLineItem,
} from "@/app/(dashboard)/invoice-lines/actions";
import {
  INVOICE_LINE_COLUMNS,
  InvoiceLineColumnKey,
} from "@/app/(dashboard)/invoice-lines/columns";
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
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  absoluteProfitMarginPercent,
  buildColumnVisibility,
  customerGroupLabel,
  formatDateValue,
  monthLabel,
  orDash,
  profitMarginPercent,
  representativeInitials,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = InvoiceLineColumnKey;

type Props = {
  page: Paged<InvoiceLineItem>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(INVOICE_LINE_COLUMNS);

const MONEY_KEYS = new Set<ColumnKey>([
  "profitProducts",
  "revenueProducts",
  "revenueOptions",
  "profitOptions",
  "revenueLine",
  "profitLine",
  "weightKg",
  "quantity",
]);

const PLAIN_NUMBER_KEYS = new Set<ColumnKey>([
  "revenueGroupNumber",
  "invoiceId",
  "orderId",
  "lineNumber",
  "customerCode",
  "lengthMm",
  "widthMm",
  "year",
]);

const decimal = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initialsOf = (name: string | null): string | null => {
  if (!name) {
    return null;
  }
  const words = name.split(" ").filter(Boolean);
  if (words.length < 2) {
    return null;
  }
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
};

export const InvoiceLinesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: InvoiceLineItem, key: ColumnKey) => {
    if (MONEY_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {decimal(row[key as keyof InvoiceLineItem] as number)}
        </TableCell>
      );
    }

    if (PLAIN_NUMBER_KEYS.has(key)) {
      const value =
        key === "year"
          ? row.invoiceDate
            ? new Date(row.invoiceDate).getFullYear()
            : null
          : (row[key as keyof InvoiceLineItem] as number | null);
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {value === null || value === undefined ? "—" : String(value)}
        </TableCell>
      );
    }

    switch (key) {
      case "invoiceDate":
        return (
          <TableCell key={key}>{formatDateValue(row.invoiceDate)}</TableCell>
        );
      case "deliveryDate":
        return (
          <TableCell key={key}>{formatDateValue(row.deliveryDate)}</TableCell>
        );
      case "productCode":
        return (
          <TableCell key={key} className="font-medium">
            {row.lineType === "orderline" ? (
              <Link
                href={`/invoice-lines/${row.lineUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.productCode)}
              </Link>
            ) : (
              orDash(row.productCode)
            )}
          </TableCell>
        );
      case "description":
        return <TableCell key={key}>{orDash(row.description)}</TableCell>;
      case "revenueGroupName":
        return <TableCell key={key}>{orDash(row.revenueGroupName)}</TableCell>;
      case "sourceType":
        return (
          <TableCell key={key}>
            {row.sourceType === "cross_dock"
              ? "CD"
              : row.sourceType
                ? "Stk"
                : "—"}
          </TableCell>
        );
      case "customerName":
        return (
          <TableCell key={key} className="font-medium">
            {row.companyUuid ? (
              <Link
                href={`/companies/${row.companyUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.customerName)}
              </Link>
            ) : (
              orDash(row.customerName)
            )}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "representativeInitials":
        return (
          <TableCell key={key}>
            {orDash(representativeInitials(row.representative))}
          </TableCell>
        );
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "sellerInitials":
        return (
          <TableCell key={key}>{orDash(initialsOf(row.sellerName))}</TableCell>
        );
      case "sellerName":
        return <TableCell key={key}>{orDash(row.sellerName)}</TableCell>;
      case "unit":
        return (
          <TableCell key={key}>
            {row.lineType === "surcharge"
              ? "Euro"
              : row.unit
                ? (STOCK_UNIT_LABELS[
                    row.unit as keyof typeof STOCK_UNIT_LABELS
                  ] ?? row.unit)
                : "—"}
          </TableCell>
        );
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "profitMarginProducts":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {absoluteProfitMarginPercent(
              row.revenueProducts,
              row.profitProducts,
            ).toFixed(1)}
          </TableCell>
        );
      case "profitMarginOptions":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {absoluteProfitMarginPercent(
              row.revenueOptions,
              row.profitOptions,
            ).toFixed(1)}
          </TableCell>
        );
      case "profitMarginLine":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {profitMarginPercent(row.revenueLine, row.profitLine).toFixed(2)}
          </TableCell>
        );
      case "commodityCode":
        return <TableCell key={key}>{orDash(row.commodityCode)}</TableCell>;
      case "month":
        return (
          <TableCell key={key}>
            {row.invoiceDate
              ? monthLabel(new Date(row.invoiceDate).getMonth() + 1)
              : "—"}
          </TableCell>
        );
      case "country":
        return <TableCell key={key}>{orDash(row.country)}</TableCell>;
      case "vatNumber":
        return <TableCell key={key}>{orDash(row.vatNumber)}</TableCell>;
      case "debtorNumber":
        return <TableCell key={key}>{orDash(row.debtorNumber)}</TableCell>;
      case "customerGroup":
        return (
          <TableCell key={key}>
            {customerGroupLabel(row.customerGroup)}
          </TableCell>
        );
      case "lineType":
        return (
          <TableCell key={key}>
            {row.lineType === "surcharge" ? "Surcharge" : "Orderline"}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product or customer…"
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
          fileName="invoice-lines"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportInvoiceLines}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No invoice lines</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Both kinds are listed here: the order lines and the surcharge lines
            raised on the invoice itself. Try clearing the search or the
            filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.lineUuid}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            singular="invoice line"
            plural="invoice lines"
          />
        </>
      )}
    </div>
  );
};
