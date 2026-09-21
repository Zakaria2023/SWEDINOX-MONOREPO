"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportOrderLines,
  OrderLineRow,
} from "@/app/(dashboard)/order-lines/actions";
import {
  orderLineColumns,
  OrderLineColumnKey,
} from "@/app/(dashboard)/order-lines/columns";
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
  formatDateValue,
  formatMoney,
  formatNumber,
  orDash,
  orderLineStatusLabel,
  salesRepresentativeLabel,
  userName,
} from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS, ORDER_TYPE_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = OrderLineColumnKey;

type Props = {
  page: Paged<OrderLineRow>;
  filters: TableFilterControl[];
  /** Clerk id -> name, for the seller column. */
  userNames: Record<string, string>;
};

const MONEY_KEYS = new Set<ColumnKey>([
  "price",
  "costPrice",
  "amount",
  "profit",
  "priceInProductUnit",
  "averagePurchasePrice",
  "priceMinusCost",
  "priceMinusApp",
]);

const NUMBER_KEYS = new Set<ColumnKey>([
  "quantity",
  "weightKg",
  "lengthMm",
  "widthMm",
  "thicknessMm",
  "orderId",
  "lineNumber",
  "customerCode",
  "revenueGroupNumber",
  "deliveries",
]);

const YES_NO_KEYS = new Set<ColumnKey>([
  "isConsignment",
  "commercialShortfall",
]);

const initialsOf = (name: string): string | null => {
  const words = name.split(" ").filter(Boolean);
  if (words.length < 2) {
    return null;
  }
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
};

export const OrderLinesTable = ({ page, filters, userNames }: Props) => {
  const allColumns = selectorColumns(orderLineColumns(userNames));
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(allColumns));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = allColumns.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: OrderLineRow, key: ColumnKey) => {
    if (MONEY_KEYS.has(key)) {
      return (
        <TableCell
          key={key}
          className="text-right whitespace-nowrap tabular-nums"
        >
          {formatMoney(row[key as keyof OrderLineRow] as number)}
        </TableCell>
      );
    }

    if (NUMBER_KEYS.has(key)) {
      const value = row[key as keyof OrderLineRow] as number | null;
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {value === null || value === undefined ? "—" : formatNumber(value)}
        </TableCell>
      );
    }

    if (YES_NO_KEYS.has(key)) {
      return (
        <TableCell key={key}>
          {row[key as keyof OrderLineRow] ? "Yes" : "No"}
        </TableCell>
      );
    }

    switch (key) {
      case "createdAt":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            <Link
              href={`/order-lines/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {formatDateValue(row.createdAt)}
            </Link>
          </TableCell>
        );
      case "deliveryDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateValue(row.deliveryDate)}
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
      case "reference":
        return <TableCell key={key}>{orDash(row.reference)}</TableCell>;
      case "ourReference":
        return <TableCell key={key}>{orDash(row.ourReference)}</TableCell>;
      case "lineStatus":
        return (
          <TableCell key={key}>
            {orderLineStatusLabel(row.lineStatus)}
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
          <TableCell key={key}>
            {row.orderType ? ORDER_TYPE_LABELS[row.orderType] : "—"}
          </TableCell>
        );
      case "productCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.productCode)}
          </TableCell>
        );
      case "description":
        return <TableCell key={key}>{orDash(row.description)}</TableCell>;
      case "options":
        return <TableCell key={key}>{orDash(row.options)}</TableCell>;
      case "unit":
        return (
          <TableCell key={key}>{row.unit?.toUpperCase() ?? "—"}</TableCell>
        );
      case "priceUnit":
        return <TableCell key={key}>{orDash(row.priceUnit)}</TableCell>;
      case "productPriceUnit":
        return <TableCell key={key}>{orDash(row.productPriceUnit)}</TableCell>;
      case "profitMargin":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {formatNumber(row.profitMargin)}%
          </TableCell>
        );
      case "marginVsApp":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {formatNumber(row.marginVsApp)}%
          </TableCell>
        );
      case "seller":
        return (
          <TableCell key={key}>{userName(row.seller, userNames)}</TableCell>
        );
      case "sellerInitials":
        return (
          <TableCell key={key}>
            {orDash(initialsOf(userName(row.seller, userNames)))}
          </TableCell>
        );
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "revenueGroupName":
        return <TableCell key={key}>{orDash(row.revenueGroupName)}</TableCell>;
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "qualityCode":
        return <TableCell key={key}>{orDash(row.qualityCode)}</TableCell>;
      case "stockCategory":
        return <TableCell key={key}>{orDash(row.stockCategory)}</TableCell>;
      case "country":
        return <TableCell key={key}>{orDash(row.country)}</TableCell>;
      case "destinationCountry":
        return (
          <TableCell key={key}>{orDash(row.destinationCountry)}</TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product, reference or customer…"
        filters={filters}
      >
        <ColumnSelector
          columns={allColumns.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="order-lines"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportOrderLines}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No order lines</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Try clearing the search or the filters.
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
                  <TableRow key={row.uuid}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            singular="order line"
            plural="order lines"
          />
        </>
      )}
    </div>
  );
};
