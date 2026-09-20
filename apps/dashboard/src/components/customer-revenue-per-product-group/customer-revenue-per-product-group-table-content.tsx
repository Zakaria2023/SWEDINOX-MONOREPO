"use client";

import { useState } from "react";
import {
  CustomerRevenuePerProductGroupRow,
  exportCustomerRevenuePerProductGroup,
} from "@/app/(dashboard)/customer-revenue-per-product-group/actions";
import {
  CUSTOMER_REVENUE_PER_PRODUCT_GROUP_COLUMNS,
  CustomerRevenuePerProductGroupColumnKey,
} from "@/app/(dashboard)/customer-revenue-per-product-group/columns";
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
  customerGroupLabel,
  formatDateValue,
  monthLabel,
  orDash,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = CustomerRevenuePerProductGroupColumnKey;

type Props = {
  page: Paged<CustomerRevenuePerProductGroupRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(CUSTOMER_REVENUE_PER_PRODUCT_GROUP_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  customerName: "customerName",
  invoiceDate: "invoiceDate",
  productGroupName: "productGroup",
};

const DECIMAL_KEYS = new Set<ColumnKey>([
  "salesPriceUnit",
  "weightKg",
  "revenue",
  "profit",
  "profitMargin",
]);

const decimal = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const CustomerRevenuePerProductGroupTable = ({
  page,
  filters,
}: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (
    row: CustomerRevenuePerProductGroupRow,
    key: ColumnKey,
  ) => {
    if (DECIMAL_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {decimal(
            row[
              key as
                | "salesPriceUnit"
                | "weightKg"
                | "revenue"
                | "profit"
                | "profitMargin"
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
      case "transportRegion":
        return <TableCell key={key}>{orDash(row.transportRegion)}</TableCell>;
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
      case "productGroupName":
        return (
          <TableCell key={key} className="font-medium">
            {orDash(row.productGroupName)}
          </TableCell>
        );
      case "subgroup1Name":
        return <TableCell key={key}>{orDash(row.subgroup1Name)}</TableCell>;
      case "subgroup2Name":
        return <TableCell key={key}>{orDash(row.subgroup2Name)}</TableCell>;
      case "year":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.year}
          </TableCell>
        );
      case "month":
        return <TableCell key={key}>{monthLabel(row.month)}</TableCell>;
      case "invoiceDate":
        return (
          <TableCell key={key}>{formatDateValue(row.invoiceDate)}</TableCell>
        );
      case "sourceType":
        return (
          <TableCell key={key}>
            {ORDER_SOURCE_TYPE_LABELS[row.sourceType]}
          </TableCell>
        );
      case "option1":
        return <TableCell key={key}>{orDash(row.option1)}</TableCell>;
      case "option2":
        return <TableCell key={key}>{orDash(row.option2)}</TableCell>;
      case "priceUnit":
        return <TableCell key={key}>{orDash(row.priceUnit)}</TableCell>;
      case "invoiceLines":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.invoiceLines}
          </TableCell>
        );
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search customer or product group…"
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
          fileName="customer-revenue-per-product-group"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportCustomerRevenuePerProductGroup}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No invoiced revenue</p>
          <p className="max-w-md text-sm text-muted-foreground">
            This screen reports the product half of an invoice line. Try
            clearing the search, the invoice date or the filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((col) => {
                    const sortKey = SORTABLE[col.key];
                    if (sortKey) {
                      return (
                        <TableSortHeader key={col.key} sortKey={sortKey}>
                          {col.label}
                        </TableSortHeader>
                      );
                    }
                    return <TableHead key={col.key}>{col.label}</TableHead>;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row, index) => (
                  <TableRow
                    key={`${row.customerName}-${row.productGroupName}-${row.invoiceDate}-${index}`}
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
