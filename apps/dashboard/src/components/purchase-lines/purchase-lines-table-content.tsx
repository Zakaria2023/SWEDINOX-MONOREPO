"use client";

import Link from "next/link";
import {
  exportPurchaseLines,
  PurchaseLineItem,
} from "@/app/(dashboard)/purchase-lines/actions";
import {
  PURCHASE_LINE_COLUMNS,
  PurchaseLineColumnKey,
} from "@/app/(dashboard)/purchase-lines/columns";
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
  formatLengthMm,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import {
  CE_STANDARD_LABELS,
  ORDER_LINE_STATUS_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = PurchaseLineColumnKey;

type Props = {
  page: Paged<PurchaseLineItem>;
  filters: TableFilterControl[];
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(PURCHASE_LINE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  createdAt: "createdAt",
  supplierName: "supplier",
  productCode: "productCode",
  qtyPlanned: "quantity",
};

const quantity = (value: string | number | null) =>
  value === null ? "—" : formatNumber(Number(value));

export const PurchaseLinesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: PurchaseLineItem, key: ColumnKey) => {
    switch (key) {
      case "createdAt":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.createdAt)}
          </TableCell>
        );
      case "purchaseOrderId":
        return (
          <TableCell key={key} className="text-right font-medium">
            <Link
              href={`/purchase-lines/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {row.purchaseOrderId ?? `#${row.id}`}
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
              label={row.status ? ORDER_LINE_STATUS_LABELS[row.status] : null}
            />
          </TableCell>
        );
      case "supplierName":
        return <TableCell key={key}>{row.supplierName ?? "—"}</TableCell>;
      case "productCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            {row.productCode ?? "—"}
          </TableCell>
        );
      case "productName":
        return <TableCell key={key}>{row.productName ?? "—"}</TableCell>;
      case "qualityCode":
        return <TableCell key={key}>{row.qualityCode ?? "—"}</TableCell>;
      case "stockCategory":
        return <TableCell key={key}>{row.stockCategory ?? "—"}</TableCell>;
      case "options":
        return <TableCell key={key}>{row.options ?? "—"}</TableCell>;
      case "lengthMm":
        return (
          <TableCell key={key} className="text-right">
            {formatLengthMm(row.lengthMm)}
          </TableCell>
        );
      case "widthMm":
        return (
          <TableCell key={key} className="text-right">
            {row.widthMm ?? "—"}
          </TableCell>
        );
      case "thicknessMm":
        return (
          <TableCell key={key} className="text-right">
            {row.thicknessMm ?? "—"}
          </TableCell>
        );
      case "qtyPlanned":
        return (
          <TableCell key={key} className="text-right">
            {quantity(row.qtyPlanned)}
          </TableCell>
        );
      case "unit":
        return (
          <TableCell key={key}>
            {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
          </TableCell>
        );
      case "reservedQty":
        return (
          <TableCell key={key} className="text-right">
            {quantity(row.reservedQty)}
          </TableCell>
        );
      case "kgPurchased":
        return (
          <TableCell key={key} className="text-right">
            {quantity(row.kgPurchased)}
          </TableCell>
        );
      case "qtyOrdered":
        return (
          <TableCell key={key} className="text-right">
            {quantity(row.qtyOrdered)}
          </TableCell>
        );
      case "qtyConfirmed":
        return (
          <TableCell key={key} className="text-right">
            {quantity(row.qtyConfirmed)}
          </TableCell>
        );
      case "qtyReceived":
        return (
          <TableCell key={key} className="text-right">
            {quantity(row.qtyReceived)}
          </TableCell>
        );
      case "kgActual":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.kgActual)}
          </TableCell>
        );
      case "kgStillToReceive":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.kgStillToReceive)}
          </TableCell>
        );
      case "availableQty":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.availableQty)}
          </TableCell>
        );
      case "availableKg":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.availableKg)}
          </TableCell>
        );
      case "netPrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.netPrice ?? 0))}
          </TableCell>
        );
      case "priceUnit":
        return <TableCell key={key}>{row.priceUnit ?? "—"}</TableCell>;
      case "amount":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(row.amount)}
          </TableCell>
        );
      case "amountYetToBeReceived":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(row.amountYetToBeReceived)}
          </TableCell>
        );
      case "receiptDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.receiptDate)}
          </TableCell>
        );
      case "purchaser":
        return <TableCell key={key}>{row.purchaser ?? "—"}</TableCell>;
      case "purchaserInitials":
        return (
          <TableCell key={key}>{row.purchaserInitials ?? "—"}</TableCell>
        );
      case "documentKind":
        return <TableCell key={key}>Purchase order</TableCell>;
      case "companyCode":
        return <TableCell key={key}>{row.companyCode ?? "—"}</TableCell>;
      case "country":
        return <TableCell key={key}>{row.country ?? "—"}</TableCell>;
      case "orderType":
        return (
          <TableCell key={key}>
            {row.orderType ? PURCHASE_ORDER_TYPE_LABELS[row.orderType] : "—"}
          </TableCell>
        );
      case "lineType":
        return <TableCell key={key}>{row.lineType}</TableCell>;
      case "qtyStillToReceive":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.qtyStillToReceive)}
          </TableCell>
        );
      case "reservedKg":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.reservedKg)}
          </TableCell>
        );
      case "grossPrice":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(Number(row.grossPrice ?? 0))}
          </TableCell>
        );
      case "grossPriceUnit":
        return <TableCell key={key}>{row.priceUnit ?? "—"}</TableCell>;
      case "margin":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {row.margin === null ? "—" : formatMoney(row.margin)}
          </TableCell>
        );
      case "mainGroup":
        return <TableCell key={key}>{row.mainGroup ?? "—"}</TableCell>;
      case "subgroup":
        return <TableCell key={key}>{row.subgroup ?? "—"}</TableCell>;
      case "revenueGroupNumber":
        return (
          <TableCell key={key} className="text-right">
            {row.revenueGroupNumber ?? "—"}
          </TableCell>
        );
      case "revenueGroupName":
        return <TableCell key={key}>{row.revenueGroupName ?? "—"}</TableCell>;
      case "purchaseReference":
        return (
          <TableCell key={key}>{row.purchaseReference ?? "—"}</TableCell>
        );
      case "ourReference":
        return <TableCell key={key}>{row.ourReference ?? "—"}</TableCell>;
      case "ceStandard":
        return (
          <TableCell key={key}>
            {row.ceStandard ? CE_STANDARD_LABELS[row.ceStandard] : "—"}
          </TableCell>
        );
      case "dop":
        return <TableCell key={key}>{row.dop ?? "—"}</TableCell>;
      case "deadline":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.deadline)}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product or supplier…"
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
          fileName="purchase-lines"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportPurchaseLines}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No purchase lines match this view</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Every line on every purchase order appears here. Clear the search or
            the filters to see more.
          </p>
        </div>
      ) : (
        <>
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
              {page.rows.map((row) => (
                <TableRow key={row.uuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="purchase line"
            plural="purchase lines"
          />
        </>
      )}
    </div>
  );
};
