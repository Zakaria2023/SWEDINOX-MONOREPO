"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportProductPrices,
  ProductPriceRow,
} from "@/app/(dashboard)/product-prices/actions";
import {
  PRODUCT_PRICE_COLUMNS,
  ProductPriceColumnKey,
} from "@/app/(dashboard)/product-prices/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { ColumnSelector } from "@/components/ui/column-selector";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatMoney,
  formatPercent,
  orDash,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = ProductPriceColumnKey;

type Props = {
  page: Paged<ProductPriceRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(PRODUCT_PRICE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  productCode: "productCode",
  name: "name",
  basePrice: "basePrice",
  markup: "markup",
  fixedSalesPrice: "fixedSalesPrice",
};

const RIGHT_ALIGNED = new Set<ColumnKey>([
  "replacementPrice",
  "basePrice",
  "markup",
  "averagePurchasePrice",
  "fixedSalesPrice",
]);

export const ProductPricesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: ProductPriceRow, key: ColumnKey) => {
    switch (key) {
      case "productCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            <Link
              href={`/products/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {row.productCode}
            </Link>
          </TableCell>
        );
      case "oldProductCode":
        return <TableCell key={key}>{orDash(row.oldProductCode)}</TableCell>;
      case "name":
        return <TableCell key={key}>{row.name}</TableCell>;
      case "priceUnit":
        return <TableCell key={key}>{orDash(row.priceUnit)}</TableCell>;
      case "groupProduct":
        return (
          <TableCell key={key}>
            <BooleanFlag on={row.groupProduct} label="Group product" />
          </TableCell>
        );
      case "stockProduct":
        return (
          <TableCell key={key}>
            <BooleanFlag on={row.stockProduct} label="Stock product" />
          </TableCell>
        );
      case "standardProduct":
        return (
          <TableCell key={key}>
            <BooleanFlag on={row.standardProduct} label="Standard product" />
          </TableCell>
        );
      case "mainGroup":
        return <TableCell key={key}>{orDash(row.mainGroup)}</TableCell>;
      case "subGroup":
        return <TableCell key={key}>{orDash(row.subGroup)}</TableCell>;
      case "preferredSupplier":
        return <TableCell key={key}>{orDash(row.preferredSupplier)}</TableCell>;
      case "supplierProductCode":
        return (
          <TableCell key={key}>{orDash(row.supplierProductCode)}</TableCell>
        );
      case "replacementPrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.replacementPrice ?? 0))}
          </TableCell>
        );
      case "basePrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.basePrice ?? 0))}
          </TableCell>
        );
      case "markup":
        return (
          <TableCell key={key} className="text-right">
            {formatPercent(Number(row.markup ?? 0))}
          </TableCell>
        );
      case "averagePurchasePrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.averagePurchasePrice ?? 0))}
          </TableCell>
        );
      case "orderAdviceCode":
        return <TableCell key={key}>{orDash(row.orderAdviceCode)}</TableCell>;
      case "fixedSalesPrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.fixedSalesPrice ?? 0))}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search code, old code or product…"
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
          fileName="product-prices"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportProductPrices}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No products</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Products appear here once the catalogue holds one. Try clearing the
            search or the filters.
          </p>
        </div>
      ) : (
        <>
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
                  return (
                    <TableHead
                      key={col.key}
                      className={
                        RIGHT_ALIGNED.has(col.key) ? "text-right" : undefined
                      }
                    >
                      {col.label}
                    </TableHead>
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
          <TablePagination page={page} singular="product" plural="products" />
        </>
      )}
    </div>
  );
};
