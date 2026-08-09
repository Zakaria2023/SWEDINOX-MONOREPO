"use client";

import { useState } from "react";
import Link from "next/link";
import {
  exportProducts,
  ProductListItem,
} from "@/app/(dashboard)/products/actions";
import {
  PRODUCT_COLUMNS,
  ProductColumnKey,
} from "@/app/(dashboard)/products/columns";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { Paged, TableFilterControl } from "@/lib/table-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { buildColumnVisibility } from "@/lib/helpers";
import { SALES_UNIT_LABELS } from "@/lib/labels";
import { SalesUnit } from "@/lib/enums";

type ColumnKey = ProductColumnKey;

// The column selector and the export read the same declaration — see
// app/(dashboard)/products/columns.ts — so a column cannot be on screen and
// missing from the file.
const ALL_COLUMNS = selectorColumns(PRODUCT_COLUMNS);

// The columns a header may sort on, matching the keys actions.ts declared.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  productCode: "productCode",
  name: "name",
  productGroup: "productGroup",
};

type Props = {
  page: Paged<ProductListItem>;
  filters: TableFilterControl[];
};

export const ProductsTable = ({ page, filters }: Props) => {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    buildColumnVisibility(ALL_COLUMNS),
  );

  const handleToggle = (key: string) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderCell = (row: ProductListItem, key: ColumnKey) => {
    switch (key) {
      case "productCode":
        return (
          <Link
            href={`/products/${row.uuid}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {row.productCode}
          </Link>
        );
      case "commodityCode":
        return row.commodityCode ?? "—";
      case "productGroup":
        return row.productGroupName ?? "—";
      case "name":
        return row.name;
      case "stockProduct":
        return row.stockProduct ? "Yes" : "No";
      case "standardProduct":
        return row.standardProduct ? "Yes" : "No";
      case "length":
        return row.length ?? "—";
      case "widthDiameter":
        return row.widthDiameter ?? "—";
      case "thickness":
        return row.thickness ?? "—";
      case "technicalStock":
        return row.technicalStock;
      case "stockUnit":
        return row.stockUnit
          ? (SALES_UNIT_LABELS[row.stockUnit as SalesUnit] ?? row.stockUnit)
          : "—";
      case "theoreticalWeight":
        return row.theoreticalWeight;
      case "weightUnit":
        return row.weightUnit
          ? (SALES_UNIT_LABELS[row.weightUnit as SalesUnit] ?? row.weightUnit)
          : "—";
    }
  };

  const visible = ALL_COLUMNS.filter(
    (c) => visibility[c.key] ?? c.defaultVisible,
  );

  return (
    <div className="space-y-3">
      <TableToolbar
        searchPlaceholder="Search product code, name or commodity code…"
        filters={filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS}
          visibility={visibility}
          onToggle={handleToggle}
        />
        <PagedTableExportButton
          fileName="products"
          columnKeys={visible.map((column) => column.key)}
          action={exportProducts}
        />
      </TableToolbar>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visible.map((col) => {
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
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visible.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((row) => (
                <TableRow key={row.uuid}>
                  {visible.map((col) => (
                    <TableCell key={col.key}>
                      {renderCell(row, col.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} singular="product" plural="products" />
    </div>
  );
};
