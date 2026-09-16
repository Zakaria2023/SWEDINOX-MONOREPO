"use client";

import { OrderAdviceRow } from "@/app/(dashboard)/order-advice/actions";
import {
  ORDER_ADVICE_COLUMNS,
  OrderAdviceColumnKey,
} from "@/app/(dashboard)/order-advice/columns";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { TableExportButton } from "@/components/ui/table-export-button";
import { selectorColumns } from "@/lib/excel";
import { buildColumnVisibility, cn, formatNumber } from "@/lib/helpers";
import { DELIVERY_TIME_UNIT_LABELS } from "@/lib/labels";
import { useState } from "react";

type ColumnKey = OrderAdviceColumnKey;

type Props = {
  rows: OrderAdviceRow[];
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(ORDER_ADVICE_COLUMNS);

// What the footer does under each column. The reference sums quantities and
// averages durations — "Σ=" under a stock or a demand figure, "AVR=" under a
// coverage, because months of cover do not add up to anything. A price, a
// factor or a ratio gets neither.
const FOOTER_SUMS = new Set<ColumnKey>([
  "stockPurchaseUnit",
  "reservedPurchaseUnit",
  "availableKg",
  "toBeReceivedShortTermKg",
  "economicStockKg",
  "avgMonthlyConsumptionLastYearKg",
  "consumptionPreviousMonthKg",
  "avgMonthlyConsumptionLast3YearsKg",
  "adviceWeightRounded",
  "adviceQtyPurchaseUnit",
  "orderQtyPurchaseUnit",
  "availablePurchaseUnit",
  "notReservedCallOff",
  "notReservedOther",
  "notCoveredOther",
  "blockedPurchaseUnit",
  "economicStockPurchaseUnit",
  "consignment",
  "consignmentKg",
  "toBeReceivedShortTermPurchaseUnit",
  "toBeReceivedLongTermKg",
  "toBeReceivedLongTermPurchaseUnit",
  "consumptionPreviousMonth",
  "consumptionLast3Months",
  "consumptionLast3MonthsKg",
  "consumptionLastYear",
  "consumptionLastYearKg",
  "avgMonthlyConsumptionLast3Months",
  "avgMonthlyConsumptionPreviousYear",
  "avgMonthlyConsumptionLast2Years",
  "avgMonthlyConsumptionLast2YearsKg",
  "avgMonthlyConsumptionLast3Years",
  "adviceQtyRounded",
  "amount",
]);

const FOOTER_AVERAGES = new Set<ColumnKey>([
  "economicCoverage",
  "technicalCoverage",
  "turnoverRate",
]);

const orDash = (value: number | null) =>
  value === null ? "—" : formatNumber(value);

// A column's figure for the footer, whatever the column is. Anything that is not
// a number contributes nothing, so a text column simply has no total.
const numericValue = (row: OrderAdviceRow, key: ColumnKey): number | null => {
  const value = row[key];
  return typeof value === "number" ? value : null;
};

const footerFor = (rows: OrderAdviceRow[], key: ColumnKey): string => {
  const values = rows
    .map((row) => numericValue(row, key))
    .filter((value): value is number => value !== null);
  if (FOOTER_SUMS.has(key)) {
    return `Σ=${formatNumber(values.reduce((total, value) => total + value, 0))}`;
  }
  if (FOOTER_AVERAGES.has(key)) {
    return values.length === 0
      ? "—"
      : `AVR=${formatNumber(
          values.reduce((total, value) => total + value, 0) / values.length,
        )}`;
  }
  return "";
};

export const OrderAdviceTable = ({ rows }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: OrderAdviceRow, key: ColumnKey) => {
    switch (key) {
      case "productCode":
        return (
          <TableCell key={key} className="font-medium">
            {row.productCode}
          </TableCell>
        );
      case "stockProduct":
        return (
          <TableCell key={key}>
            <Checkbox checked={row.stockProduct ?? false} disabled />
          </TableCell>
        );
      case "orderQtyPurchaseUnit":
        return (
          <TableCell
            key={key}
            className={cn(
              "text-right tabular-nums",
              (row.orderQtyPurchaseUnit ?? 0) > 0 &&
                "font-semibold text-amber-700",
            )}
          >
            {orDash(row.orderQtyPurchaseUnit)}
          </TableCell>
        );
      case "deliveryTimeUnit":
        return (
          <TableCell key={key}>
            {row.deliveryTimeUnit
              ? DELIVERY_TIME_UNIT_LABELS[row.deliveryTimeUnit]
              : "—"}
          </TableCell>
        );
      case "description":
      case "mainGroup":
      case "supplierName":
      case "productGroup":
      case "quality":
      case "revenueGroupName":
      case "pacCode":
      case "orderAdviceCode":
      case "orderAdviceNotes":
      case "purchaseUnit":
      case "replacementPriceUnit":
      case "supplierCode":
      case "supplierProductNo":
      case "minOrderQtyUnit":
      case "orderSeriesUnit":
      case "minStockMethod":
      case "maxStockMethod":
        return <TableCell key={key}>{row[key] ?? "—"}</TableCell>;
      case "stockPurchaseUnit":
      case "reservedPurchaseUnit":
      case "availableKg":
      case "toBeReceivedShortTermKg":
      case "economicStockKg":
      case "avgMonthlyConsumptionLastYearKg":
      case "consumptionPreviousMonthKg":
      case "avgMonthlyConsumptionLast3YearsKg":
      case "adviceWeightRounded":
      case "economicCoverage":
      case "technicalCoverage":
      case "adviceQtyPurchaseUnit":
      case "revenueGroupNumber":
      case "theoreticalWeight":
      case "deliveryTime":
      case "minOrderQty":
      case "orderSeries":
      case "minStock":
      case "maxStock":
      case "minStockFixedValue":
      case "minStockFactor":
      case "maxStockFixedValue":
      case "maxStockFactor":
      case "availablePurchaseUnit":
      case "notReservedCallOff":
      case "notReservedOther":
      case "notCoveredOther":
      case "blockedPurchaseUnit":
      case "economicStockPurchaseUnit":
      case "consignment":
      case "consignmentKg":
      case "toBeReceivedShortTermPurchaseUnit":
      case "toBeReceivedLongTermKg":
      case "toBeReceivedLongTermPurchaseUnit":
      case "consumptionPreviousMonth":
      case "consumptionLast3Months":
      case "consumptionLast3MonthsKg":
      case "consumptionLastYear":
      case "consumptionLastYearKg":
      case "avgMonthlyConsumptionLast3Months":
      case "avgMonthlyConsumptionPreviousYear":
      case "avgMonthlyConsumptionLast2Years":
      case "avgMonthlyConsumptionLast2YearsKg":
      case "avgMonthlyConsumptionLast3Years":
      case "consumptionTrend":
      case "adviceQtyRounded":
      case "replacementPrice":
      case "amount":
      case "turnoverRate":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {orDash(row[key])}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-2">
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <TableExportButton
          tableId="order-advice-table"
          fileName="order-advice"
        />
      </div>

      <div className="overflow-x-auto">
        <Table id="order-advice-table">
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(visibleColumns.length, 1)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock products to advise on.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.productUuid}
                  // A line with something to buy is the reason the buyer opened
                  // this screen, so it is picked out of a page of zeroes.
                  className={cn(
                    (row.orderQtyPurchaseUnit ?? 0) > 0 && "bg-amber-50",
                  )}
                >
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                {visibleColumns.map((col) => (
                  <TableCell key={col.key} className="text-right tabular-nums">
                    {footerFor(rows, col.key)}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
};
