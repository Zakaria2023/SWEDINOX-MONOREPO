"use client";

import { useState } from "react";
import {
  CustomerRevenueRow,
  exportCustomerRevenue,
} from "@/app/(dashboard)/customer-revenue/actions";
import {
  CUSTOMER_REVENUE_COLUMNS,
  CustomerRevenueColumnKey,
} from "@/app/(dashboard)/customer-revenue/columns";
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
  formatDateValue,
  monthLabel,
  orDash,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = CustomerRevenueColumnKey;

type Props = {
  page: Paged<CustomerRevenueRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(CUSTOMER_REVENUE_COLUMNS);

const MONEY_KEYS = new Set<ColumnKey>([
  "materialRevenue",
  "optionsRevenue",
  "surchargesRevenue",
  "revenue",
  "materialProfit",
  "optionsProfit",
  "surchargesProfit",
  "profit",
  "profitMargin",
]);

const COUNT_KEYS = new Set<ColumnKey>([
  "customerCode",
  "year",
  "weightKg",
  "invoices",
  "invoiceLines",
  "calledThisYear",
  "visitsThisYear",
]);

const decimal = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const CustomerRevenueTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: CustomerRevenueRow, key: ColumnKey) => {
    if (MONEY_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {decimal(row[key as keyof CustomerRevenueRow] as number)}
        </TableCell>
      );
    }

    if (COUNT_KEYS.has(key)) {
      const value = row[key as keyof CustomerRevenueRow];
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {value === null ? "—" : String(value)}
        </TableCell>
      );
    }

    switch (key) {
      case "customerName":
        return (
          <TableCell key={key} className="font-medium">
            {orDash(row.customerName)}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "country":
        return <TableCell key={key}>{orDash(row.country)}</TableCell>;
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "accountManager":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.accountManager)}
          </TableCell>
        );
      case "customerGroup":
        return (
          <TableCell key={key}>
            {customerGroupLabel(row.customerGroup)}
          </TableCell>
        );
      case "active":
        return <TableCell key={key}>{row.active ? "Yes" : "No"}</TableCell>;
      case "month":
        return <TableCell key={key}>{monthLabel(row.month)}</TableCell>;
      case "lastOrderDate":
        return (
          <TableCell key={key}>{formatDateValue(row.lastOrderDate)}</TableCell>
        );
      case "lastCallDate":
        return (
          <TableCell key={key}>{formatDateValue(row.lastCallDate)}</TableCell>
        );
      case "lastVisitDate":
        return (
          <TableCell key={key}>{formatDateValue(row.lastVisitDate)}</TableCell>
        );
      case "pointOfAttention":
        // The company's own remark, which is a paragraph rather than a cell.
        return (
          <TableCell key={key} className="max-w-md whitespace-pre-wrap">
            {orDash(row.pointOfAttention)}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder="Search customer…" filters={filters}>
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="customer-revenue"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportCustomerRevenue}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No invoiced revenue</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Material, options and surcharges are each reported on their own. Try
            clearing the search, the period or the filters.
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
                    key={`${row.customerCode}-${row.year}-${row.month}-${index}`}
                  >
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="row" plural="rows" />
        </>
      )}
    </div>
  );
};
