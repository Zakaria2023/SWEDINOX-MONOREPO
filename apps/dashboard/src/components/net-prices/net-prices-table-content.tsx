"use client";

import Link from "next/link";
import { exportNetPrices, NetPriceRow } from "@/app/(dashboard)/net-prices/actions";
import {
  NET_PRICE_COLUMNS,
  NetPriceColumnKey,
} from "@/app/(dashboard)/net-prices/columns";
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
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = NetPriceColumnKey;

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(NET_PRICE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  contractCode: "contractCode",
  productCode: "productCode",
  netPrice: "netPrice",
  validFrom: "validFrom",
  fromQty: "fromQty",
};

type Props = {
  page: Paged<NetPriceRow>;
  filters: TableFilterControl[];
};

export const NetPricesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: NetPriceRow, key: ColumnKey) => {
    switch (key) {
      case "contractCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            <Link
              href={`/net-prices/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {row.contractCode ?? `Net price #${row.id}`}
            </Link>
          </TableCell>
        );
      case "contractDescription":
        return <TableCell key={key}>{row.contractDescription ?? "—"}</TableCell>;
      case "companyCode":
        return (
          <TableCell key={key} className="text-right">
            {row.companyCode ?? "—"}
          </TableCell>
        );
      case "companyName":
        return <TableCell key={key}>{row.companyName ?? "—"}</TableCell>;
      case "productCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {row.productCode ?? "—"}
          </TableCell>
        );
      case "oldProductCode":
        return <TableCell key={key}>{row.oldProductCode ?? "—"}</TableCell>;
      case "productName":
        return <TableCell key={key}>{row.productName ?? "—"}</TableCell>;
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
        return <TableCell key={key}>{row.mainGroup ?? "—"}</TableCell>;
      case "subGroup":
        return <TableCell key={key}>{row.subGroup ?? "—"}</TableCell>;
      case "preferredSupplier":
        return <TableCell key={key}>{row.preferredSupplier ?? "—"}</TableCell>;
      case "supplierProductCode":
        return (
          <TableCell key={key}>{row.supplierProductCode ?? "—"}</TableCell>
        );
      case "basePrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.basePrice ?? 0))}
          </TableCell>
        );
      case "discountPercent":
        return (
          <TableCell key={key} className="text-right">
            {formatPercent(Number(row.discountPercent ?? 0))}
          </TableCell>
        );
      case "netPrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.netPrice ?? 0))}
          </TableCell>
        );
      case "netPriceUnit":
        return <TableCell key={key}>{row.netPriceUnit ?? "—"}</TableCell>;
      case "validFrom":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.validFrom)}
          </TableCell>
        );
      case "validUntil":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.validUntil)}
          </TableCell>
        );
      case "fromQty":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatNumber(Number(row.fromQty ?? 0))}
          </TableCell>
        );
      case "fromQtyUnit":
        return <TableCell key={key}>{row.fromQtyUnit ?? "—"}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product, contract or company…"
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
          fileName="net-prices"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportNetPrices}
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
                <TableHead key={col.key}>{col.label}</TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No net prices found.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row) => (
              <TableRow key={row.uuid}>
                {visibleColumns.map((col) => renderCell(row, col.key))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} singular="net price" plural="net prices" />
    </div>
  );
};
