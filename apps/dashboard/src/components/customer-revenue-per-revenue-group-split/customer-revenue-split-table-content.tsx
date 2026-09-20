"use client";

import { useState } from "react";
import {
  CustomerRevenueSplitRow,
  exportCustomerRevenueSplit,
} from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/actions";
import {
  CUSTOMER_REVENUE_SPLIT_COLUMNS,
  CustomerRevenueSplitColumnKey,
} from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/columns";
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
  buildColumnVisibility,
  customerGroupLabel,
  monthLabel,
  orDash,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS, ORDER_TYPE_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = CustomerRevenueSplitColumnKey;

type Props = {
  page: Paged<CustomerRevenueSplitRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(CUSTOMER_REVENUE_SPLIT_COLUMNS);

const DECIMAL_KEYS = new Set<ColumnKey>([
  "salesPriceUnit",
  "profit",
  "profitMargin",
  "revenue",
  "weightKg",
]);

const decimal = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const CustomerRevenueSplitTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: CustomerRevenueSplitRow, key: ColumnKey) => {
    if (DECIMAL_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {decimal(
            row[
              key as
                | "salesPriceUnit"
                | "profit"
                | "profitMargin"
                | "revenue"
                | "weightKg"
            ],
          )}
        </TableCell>
      );
    }

    switch (key) {
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "customerGroup":
        return (
          <TableCell key={key}>
            {customerGroupLabel(row.customerGroup)}
          </TableCell>
        );
      case "debtorNumber":
        return <TableCell key={key}>{orDash(row.debtorNumber)}</TableCell>;
      case "customerName":
        return (
          <TableCell key={key} className="font-medium">
            {orDash(row.customerName)}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "revenueGroupNumber":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.revenueGroupNumber ?? "—"}
          </TableCell>
        );
      case "revenueGroupName":
        return (
          <TableCell key={key} className="font-medium">
            {orDash(row.revenueGroupName)}
          </TableCell>
        );
      case "sourceType":
        return (
          <TableCell key={key}>
            {row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : "—"}
          </TableCell>
        );
      case "orderType":
        return (
          <TableCell key={key}>{ORDER_TYPE_LABELS[row.orderType]}</TableCell>
        );
      case "year":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.year}
          </TableCell>
        );
      case "month":
        return <TableCell key={key}>{monthLabel(row.month)}</TableCell>;
      case "priceUnit":
        return <TableCell key={key}>{orDash(row.priceUnit)}</TableCell>;
      case "country":
        return <TableCell key={key}>{orDash(row.country)}</TableCell>;
      case "accountManager":
        return <TableCell key={key}>{orDash(row.accountManager)}</TableCell>;
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "invoiceLines":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.invoiceLines}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search customer or revenue group…"
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
          fileName="customer-revenue-per-revenue-group-split"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportCustomerRevenueSplit}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No invoiced revenue</p>
          <p className="max-w-md text-sm text-muted-foreground">
            The same rows as the revenue-group screen, split by the type of the
            order itself. Try clearing the search or the filters.
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
                {page.rows.map((row, index) => (
                  <TableRow
                    key={`${row.customerName}-${row.revenueGroupNumber}-${row.orderType}-${row.year}-${row.month}-${index}`}
                  >
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="group" plural="groups" />
        </>
      )}
    </div>
  );
};
