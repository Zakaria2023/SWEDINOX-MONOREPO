"use client";

import Link from "next/link";
import {
  exportPurchaseReceivals,
  PurchaseReceivalRow,
} from "@/app/(dashboard)/purchase-receivals/actions";
import {
  PURCHASE_RECEIVAL_COLUMNS,
  PurchaseReceivalColumnKey,
} from "@/app/(dashboard)/purchase-receivals/columns";
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
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  cn,
  formatDateColumn,
  formatLengthMm,
  formatMoney,
  formatNumber,
  formatPriceQuantity,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  RECEIPT_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { Eye, Factory, Rows3, Warehouse } from "lucide-react";
import { useState } from "react";

type ColumnKey = PurchaseReceivalColumnKey;

type Props = {
  page: Paged<PurchaseReceivalRow>;
  filters: TableFilterControl[];
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(PURCHASE_RECEIVAL_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  purchaseOrderCode: "purchaseOrderCode",
  supplierName: "supplierName",
  productCode: "productCode",
  purchaseOrderDate: "purchaseOrderDate",
  receiptDate: "receiptDate",
  deliveryDatePlanned: "deliveryDatePlanned",
  deliveryDateActual: "deliveryDateActual",
  kgPlanned: "kgPlanned",
  kgActual: "kgActual",
  lineAmount: "lineAmount",
};

const amount = (value: string | number | null) =>
  value === null ? "—" : formatNumber(Number(value));

export const PurchaseReceivalsTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));
  // The reference acts on a selected row from a toolbar at the top, so the
  // grid has to remember which row that is.
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const selected =
    page.rows.find((row) => row.uuid === selectedUuid) ?? null;

  const rowActions: TableRowActionItem[] = [
    {
      label: "Open receipt",
      icon: <Eye className="size-4" />,
      href: selected ? `/purchase-receivals/${selected.uuid}` : null,
    },
    {
      label: "Purchase line",
      icon: <Rows3 className="size-4" />,
      href: selected?.purchaseOrderItemUuid
        ? `/purchase-lines/${selected.purchaseOrderItemUuid}`
        : null,
    },
    {
      label: "Warehouse work orders",
      icon: <Warehouse className="size-4" />,
      href: selected?.purchaseOrderCode
        ? `/warehouse-work-orders?q=${encodeURIComponent(selected.purchaseOrderCode)}`
        : null,
    },
    {
      label: "Production work orders",
      icon: <Factory className="size-4" />,
      href: selected?.purchaseOrderCode
        ? `/production-workorders?q=${encodeURIComponent(selected.purchaseOrderCode)}`
        : null,
    },
  ];

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: PurchaseReceivalRow, key: ColumnKey) => {
    switch (key) {
      case "purchaseOrderCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            {row.purchaseOrderUuid ? (
              <Link
                href={`/purchase-orders/${row.purchaseOrderUuid}`}
                className="text-primary hover:underline"
              >
                {row.purchaseOrderCode ?? `#${row.purchaseOrderId ?? row.id}`}
              </Link>
            ) : (
              (row.purchaseOrderCode ?? "—")
            )}
          </TableCell>
        );
      case "lineNumber":
        return (
          <TableCell key={key} className="text-right">
            {row.lineNumber ?? "—"}
          </TableCell>
        );
      case "supplierCode":
        return <TableCell key={key}>{row.supplierCode ?? "—"}</TableCell>;
      case "supplierName":
        return (
          <TableCell key={key}>
            {row.companyUuid && row.supplierName ? (
              <Link
                href={`/companies/${row.companyUuid}`}
                className="text-primary hover:underline"
              >
                {row.supplierName}
              </Link>
            ) : (
              (row.supplierName ?? "—")
            )}
          </TableCell>
        );
      case "purchaseOrderDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.purchaseOrderDate)}
          </TableCell>
        );
      case "lineAmount":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(row.lineAmount)}
          </TableCell>
        );
      case "qtyPlanned":
        return (
          <TableCell key={key} className="text-right">
            {amount(row.qtyPlanned)}
          </TableCell>
        );
      case "unit":
        return (
          <TableCell key={key}>
            {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
          </TableCell>
        );
      case "qtyActual":
        return (
          <TableCell key={key} className="text-right">
            {amount(row.qtyActual)}
          </TableCell>
        );
      case "confirmedQty":
        return (
          <TableCell key={key} className="text-right">
            {amount(row.confirmedQty)}
          </TableCell>
        );
      case "priceQuantity":
      case "invoicedProduction":
        // One field under two headings, and a quantity rather than money — the
        // reference's own grid masks it as a currency, which it is not.
        return (
          <TableCell key={key} className="text-right">
            {formatPriceQuantity(row.priceQuantity)}
          </TableCell>
        );
      case "options":
        return <TableCell key={key}>{row.options ?? "—"}</TableCell>;
      case "lineStatus":
        return (
          <TableCell key={key}>
            <StatusBadge
              value={row.lineStatus}
              label={
                row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null
              }
            />
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
      case "productCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            {row.productUuid && row.productCode ? (
              <Link
                href={`/products/${row.productUuid}`}
                className="text-primary hover:underline"
              >
                {row.productCode}
              </Link>
            ) : (
              (row.productCode ?? "—")
            )}
          </TableCell>
        );
      case "productName":
        return <TableCell key={key}>{row.productName ?? "—"}</TableCell>;
      case "kgActual":
        return (
          <TableCell key={key} className="text-right">
            {amount(row.kgActual)}
          </TableCell>
        );
      case "lengthMm":
        return (
          <TableCell key={key} className="text-right">
            {formatLengthMm(row.lengthMm)}
          </TableCell>
        );
      case "receiptStatus":
        return (
          <TableCell key={key}>
            <StatusBadge
              value={row.receiptStatus}
              label={
                row.receiptStatus
                  ? RECEIPT_STATUS_LABELS[row.receiptStatus]
                  : null
              }
            />
          </TableCell>
        );
      case "deliveryDateActual":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.deliveryDateActual)}
          </TableCell>
        );
      case "deliveryDatePlanned":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.deliveryDatePlanned)}
          </TableCell>
        );
      case "kgPlanned":
        return (
          <TableCell key={key} className="text-right">
            {amount(row.kgPlanned)}
          </TableCell>
        );
    }
  };

  // Shown instead of the grid rather than inside it: twenty-five columns make a
  // row wider than the window, and a sentence stretched across that width has
  // to be scrolled sideways to be read.
  const emptyState = (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
      <p className="font-medium">No receipts match this view</p>
      <p className="max-w-md text-sm text-muted-foreground">
        A receipt appears here as soon as a purchase order expects goods, and
        fills in as they arrive. Widen the scheduled delivery date or clear the
        filters to see more.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search order, product or supplier…"
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
          fileName="purchase-receivals"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportPurchaseReceivals}
        />
      </TableToolbar>

      <TableRowToolbar
        actions={rowActions}
        selectedLabel={
          selected
            ? `${selected.purchaseOrderCode ?? "—"} line ${selected.lineNumber ?? "—"}`
            : null
        }
      />

      {page.rows.length === 0 ? (
        emptyState
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
                <TableRow
                  key={row.uuid}
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer",
                    row.uuid === selectedUuid && "bg-muted",
                  )}
                >
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="receipt"
            plural="receipts"
          />
        </>
      )}
    </div>
  );
};
