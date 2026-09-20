"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportOrdersAndQuotes,
  OrderOrQuoteRow,
} from "@/app/(dashboard)/orders-and-quotes/actions";
import {
  ORDER_OR_QUOTE_COLUMNS,
  OrderOrQuoteColumnKey,
} from "@/app/(dashboard)/orders-and-quotes/columns";
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
  monthLabel,
  orDash,
  salesDocumentStatusLabel,
  salesRepresentativeLabel,
  timeFrameOf,
  userName,
} from "@/lib/helpers";
import { ORDER_METHOD_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = OrderOrQuoteColumnKey;

type Props = {
  page: Paged<OrderOrQuoteRow>;
  /** Clerk id -> name, for the seller column. */
  userNames: Record<string, string>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(ORDER_OR_QUOTE_COLUMNS);

const MONEY_KEYS = new Set<ColumnKey>([
  "weightKg",
  "revenue",
  "profit",
  "profitMargin",
]);

const YES_NO_KEYS = new Set<ColumnKey>([
  "isConsignment",
  "stillToSend",
  "deliberatelyNotSent",
  "mustBeSent",
  "isPickup",
  "isIncidental",
]);

const decimal = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initialsOf = (name: string | null): string | null => {
  if (!name) {
    return null;
  }
  const words = name.split(" ").filter(Boolean);
  if (words.length < 2) {
    return null;
  }
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
};

export const OrdersAndQuotesTable = ({ page, userNames, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: OrderOrQuoteRow, key: ColumnKey) => {
    if (MONEY_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {decimal(
            row[key as "weightKg" | "revenue" | "profit" | "profitMargin"],
          )}
        </TableCell>
      );
    }

    if (YES_NO_KEYS.has(key)) {
      return (
        <TableCell key={key}>
          {row[key as keyof OrderOrQuoteRow] ? "Yes" : "No"}
        </TableCell>
      );
    }

    switch (key) {
      case "createdAt":
        return (
          <TableCell key={key}>{formatDateValue(row.createdAt)}</TableCell>
        );
      case "year":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.createdAt.getFullYear()}
          </TableCell>
        );
      case "month":
        return (
          <TableCell key={key}>
            {monthLabel(row.createdAt.getMonth() + 1)}
          </TableCell>
        );
      case "timeFrame":
        return (
          <TableCell key={key} className="whitespace-nowrap tabular-nums">
            {timeFrameOf(row.createdAt)}
          </TableCell>
        );
      case "documentCode":
        return (
          <TableCell key={key} className="font-medium">
            <Link href={row.href} className="text-primary hover:underline">
              {row.documentCode}
            </Link>
          </TableCell>
        );
      case "sellerInitials":
        return (
          <TableCell key={key}>
            {orDash(initialsOf(userName(row.seller, userNames)))}
          </TableCell>
        );
      case "seller":
        return (
          <TableCell key={key}>{userName(row.seller, userNames)}</TableCell>
        );
      case "status":
        return (
          <TableCell key={key}>
            {orDash(salesDocumentStatusLabel(row.status))}
          </TableCell>
        );
      case "convertedFromTo":
        return <TableCell key={key}>{orDash(row.convertedFromTo)}</TableCell>;
      case "lineCount":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.lineCount}
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
      case "deliveryDate":
        return (
          <TableCell key={key}>{formatDateValue(row.deliveryDate)}</TableCell>
        );
      case "orderType":
        return <TableCell key={key}>{row.orderType}</TableCell>;
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "expirationReason":
        return <TableCell key={key}>{orDash(row.expirationReason)}</TableCell>;
      case "quoteDate":
        return (
          <TableCell key={key}>{formatDateValue(row.quoteDate)}</TableCell>
        );
      case "decisionDate":
        return (
          <TableCell key={key}>{formatDateValue(row.decisionDate)}</TableCell>
        );
      case "orderMethod":
        return (
          <TableCell key={key}>
            {row.orderMethod
              ? (ORDER_METHOD_LABELS[
                  row.orderMethod as keyof typeof ORDER_METHOD_LABELS
                ] ?? row.orderMethod)
              : "—"}
          </TableCell>
        );
      case "customerCode":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.customerCode ?? "—"}
          </TableCell>
        );
      case "validUntil":
        return (
          <TableCell key={key}>{formatDateValue(row.validUntil)}</TableCell>
        );
      case "ourReference":
        return <TableCell key={key}>{orDash(row.ourReference)}</TableCell>;
      case "reference":
        return <TableCell key={key}>{orDash(row.reference)}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search document, customer or reference…"
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
          fileName="orders-and-quotes"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportOrdersAndQuotes}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No sales documents</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Orders, returns, quotes and counter orders all appear here, told
            apart by the letter on the number. Try clearing the search or the
            filters.
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
                  <TableRow key={`${row.kind}-${row.uuid}`}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="document" plural="documents" />
        </>
      )}
    </div>
  );
};
