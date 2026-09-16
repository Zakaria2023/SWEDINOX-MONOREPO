"use client";

import Link from "next/link";
import {
  exportPurchaseOrdersAndQuotes,
  PurchaseOrderQuoteRow,
} from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import {
  PURCHASE_ORDER_QUOTE_COLUMNS,
  PurchaseOrderQuoteColumnKey,
} from "@/app/(dashboard)/purchase-orders-and-quotes/columns";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  documentStatusLabel,
  formatDateColumn,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import {
  PURCHASE_ORDER_TYPE_LABELS,
  PURCHASE_QUOTE_EXPIRATION_REASON_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = PurchaseOrderQuoteColumnKey;

type Props = {
  page: Paged<PurchaseOrderQuoteRow>;
  filters: TableFilterControl[];
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(PURCHASE_ORDER_QUOTE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  creationDate: "creationDate",
  number: "number",
  kind: "kind",
  supplierName: "supplierName",
  status: "status",
  lines: "lines",
  weightKg: "weightKg",
  revenue: "revenue",
  deliveryDate: "deliveryDate",
};

// Where a row lives: the two kinds are separate records with separate screens,
// which is exactly what this list exists to hide until you click.
const documentHref = (row: PurchaseOrderQuoteRow) =>
  row.kind === "Quote"
    ? `/purchase-quotes/${row.uuid}`
    : `/purchase-orders/${row.uuid}`;

export const PurchaseOrdersAndQuotesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: PurchaseOrderQuoteRow, key: ColumnKey) => {
    switch (key) {
      case "creationDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.creationDate)}
          </TableCell>
        );
      case "year":
        return (
          <TableCell key={key} className="text-right">
            {row.year ?? "—"}
          </TableCell>
        );
      case "month":
        return (
          <TableCell key={key} className="text-right">
            {row.month ?? "—"}
          </TableCell>
        );
      case "timeFrame":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {row.timeFrame ?? "—"}
          </TableCell>
        );
      case "number":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            <Link
              href={documentHref(row)}
              className="text-primary hover:underline"
            >
              {row.number}
            </Link>
          </TableCell>
        );
      case "purchaserInitials":
        return <TableCell key={key}>{row.purchaserInitials ?? "—"}</TableCell>;
      case "purchaser":
        return <TableCell key={key}>{row.purchaser ?? "—"}</TableCell>;
      case "status":
        return (
          <TableCell key={key}>
            <StatusBadge
              value={row.status}
              label={documentStatusLabel(row.kind, row.status)}
            />
          </TableCell>
        );
      case "convertedNumber":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {row.convertedUuid && row.convertedNumber !== null ? (
              <Link
                href={
                  row.kind === "Quote"
                    ? `/purchase-orders/${row.convertedUuid}`
                    : `/purchase-quotes/${row.convertedUuid}`
                }
                className="text-primary hover:underline"
              >
                {row.kind === "Quote" ? "Order " : "Quote "}
                {row.convertedNumber}
              </Link>
            ) : (
              "—"
            )}
          </TableCell>
        );
      case "lines":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.lines)}
          </TableCell>
        );
      case "weightKg":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.weightKg)}
          </TableCell>
        );
      case "revenue":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {formatMoney(row.revenue)}
          </TableCell>
        );
      case "supplierName":
        return (
          <TableCell key={key}>
            {row.supplierUuid && row.supplierName ? (
              <Link
                href={`/companies/${row.supplierUuid}`}
                className="text-primary hover:underline"
              >
                {row.supplierName}
              </Link>
            ) : (
              (row.supplierName ?? "—")
            )}
          </TableCell>
        );
      case "customerCode":
        return <TableCell key={key}>{row.customerCode ?? "—"}</TableCell>;
      case "deliveryDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.deliveryDate)}
          </TableCell>
        );
      case "kind":
        return <TableCell key={key}>{row.kind}</TableCell>;
      case "orderType":
        return (
          <TableCell key={key}>
            {row.orderType ? PURCHASE_ORDER_TYPE_LABELS[row.orderType] : "—"}
          </TableCell>
        );
      case "expirationReason":
        return (
          <TableCell key={key}>
            {row.expirationReason
              ? PURCHASE_QUOTE_EXPIRATION_REASON_LABELS[row.expirationReason]
              : "—"}
          </TableCell>
        );
      case "quoteDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.quoteDate)}
          </TableCell>
        );
      case "internalText":
        return <TableCell key={key}>{row.internalText ?? "—"}</TableCell>;
      case "consignment":
        return (
          <TableCell key={key}>
            {row.consignment === null ? (
              "—"
            ) : (
              <BooleanFlag on={row.consignment} label="Consignment" />
            )}
          </TableCell>
        );
      case "sent":
        return (
          <TableCell key={key}>
            <BooleanFlag on={row.sent} label="Sent" />
          </TableCell>
        );
      case "mustBeSent":
        return (
          <TableCell key={key}>
            <BooleanFlag on={row.mustBeSent} label="Must be sent" />
          </TableCell>
        );
      case "orderMethod":
        return <TableCell key={key}>{row.orderMethod ?? "—"}</TableCell>;
      case "deliberatelyNotSent":
        return (
          <TableCell key={key}>
            <BooleanFlag
              on={row.deliberatelyNotSent}
              label="Deliberately not sent"
            />
          </TableCell>
        );
      case "validUntil":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.validUntil)}
          </TableCell>
        );
      case "affiliateCompany":
        return <TableCell key={key}>{row.affiliateCompany ?? "—"}</TableCell>;
      case "classificationCode":
        return (
          <TableCell key={key}>{row.classificationCode ?? "—"}</TableCell>
        );
      case "reference":
        return <TableCell key={key}>{row.reference ?? "—"}</TableCell>;
      case "ourReference":
        return <TableCell key={key}>{row.ourReference ?? "—"}</TableCell>;
    }
  };

  // Shown instead of the grid rather than inside it: thirty columns make a row
  // wider than the window, and a sentence stretched across that width has to be
  // scrolled sideways to be read.
  const emptyState = (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
      <p className="font-medium">No purchase orders or quotes match this view</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Every quote you raise and every order you place appears here. Widen the
        creation date or clear the filters to see more.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search number, supplier or reference…"
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
          fileName="purchase-orders-and-quotes"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportPurchaseOrdersAndQuotes}
        />
      </TableToolbar>

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
                <TableRow key={`${row.kind}-${row.uuid}`}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="document"
            plural="documents"
          />
        </>
      )}
    </div>
  );
};
