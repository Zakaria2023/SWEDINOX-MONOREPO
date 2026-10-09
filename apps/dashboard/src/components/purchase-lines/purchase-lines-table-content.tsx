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
import { TableGroupRow } from "@/components/ui/table-group-row";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  cn,
  formatDateColumn,
  formatLengthMm,
  formatMoney,
  formatNumber,
  groupRowsBy,
} from "@/lib/helpers";
import {
  CE_STANDARD_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { Building2, FileText, Package } from "lucide-react";
import { Fragment, useState } from "react";

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
  // The reference acts on a selected row from a toolbar at the top, so the
  // grid has to remember which row that is.
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const selected = page.rows.find((row) => row.uuid === selectedUuid) ?? null;
  const selectedNumber =
    selected && selected.returnOrderId !== null
      ? `IR${selected.returnOrderId}`
      : (selected?.purchaseOrderId ?? "—");

  const purchaseOrderAction: TableRowActionItem = selected?.returnOrderUuid
    ? {
        label: "Show Purchase return",
        icon: <FileText className="size-4" />,
        href: `/purchase-return-orders/${selected.returnOrderUuid}`,
      }
    : {
        label: "Show Purchase order",
        icon: <FileText className="size-4" />,
        href: selected?.purchaseOrderUuid
          ? `/purchase-orders/${selected.purchaseOrderUuid}`
          : null,
      };

  const rowActions: TableRowActionItem[] = [
    {
      label: "Show Product",
      icon: <Package className="size-4" />,
      href: selected?.productUuid ? `/products/${selected.productUuid}` : null,
    },
    {
      label: "Show Company",
      icon: <Building2 className="size-4" />,
      href: selected?.supplierUuid ? `/companies/${selected.supplierUuid}` : null,
    },
    purchaseOrderAction,
  ];

  // The reference groups this screen by Line type — Stk, CD, EXW.
  const groups = groupRowsBy(page.rows, (row) =>
    ORDER_SOURCE_TYPE_LABELS[row.lineType],
  );

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
            {/* A return line opens its return — the reference's
                `Show Purchase return`. */}
            {row.returnOrderUuid ? (
              <Link
                href={`/purchase-return-orders/${row.returnOrderUuid}`}
                className="text-primary hover:underline"
              >
                IR{row.returnOrderId}
              </Link>
            ) : (
              <Link
                href={`/purchase-lines/${row.uuid}`}
                className="text-primary hover:underline"
              >
                {row.purchaseOrderId ?? `#${row.id}`}
              </Link>
            )}
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
            {row.returnStatus ? (
              <StatusBadge
                value={row.returnStatus}
                label={PURCHASE_ORDER_STATUS_LABELS[row.returnStatus]}
              />
            ) : (
              <StatusBadge
                value={row.status}
                label={row.status ? ORDER_LINE_STATUS_LABELS[row.status] : null}
              />
            )}
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
        return (
          <TableCell key={key}>
            {ORDER_SOURCE_TYPE_LABELS[row.lineType]}
          </TableCell>
        );
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

      <TableRowToolbar
        actions={rowActions}
        selectedLabel={
          selected
            ? `${selectedNumber} line ${selected.lineNumber ?? "—"}`
            : null
        }
      />

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
              {groups.map((group) => (
                <Fragment key={group.key}>
                  <TableGroupRow
                    label="Line type"
                    value={group.key}
                    count={group.rows.length}
                    colSpan={visibleColumns.length}
                  />
                  {group.rows.map((row) => (
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
                </Fragment>
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
