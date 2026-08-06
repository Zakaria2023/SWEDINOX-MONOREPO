"use client";

import Link from "next/link";
import { PurchaseInvoiceListItem } from "@/app/(dashboard)/purchase-invoices/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { buildColumnVisibility } from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
} from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "companyName"
  | "sentBy"
  | "supplierCode"
  | "invoiceDate"
  | "expirationDate"
  | "invoiceTotal"
  | "paymentTerms"
  | "blocked"
  | "blockReason";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "id", label: "No.", defaultVisible: true },
  { key: "companyName", label: "Supplier", defaultVisible: true },
  { key: "sentBy", label: "Sent By", defaultVisible: true },
  { key: "supplierCode", label: "Supplier Code", defaultVisible: true },
  { key: "invoiceDate", label: "Invoice Date", defaultVisible: true },
  { key: "expirationDate", label: "Exp. Date", defaultVisible: true },
  { key: "invoiceTotal", label: "Total", defaultVisible: true },
  { key: "paymentTerms", label: "Payment Terms", defaultVisible: true },
  { key: "blocked", label: "Blocked", defaultVisible: true },
  { key: "blockReason", label: "Block Reason", defaultVisible: true },
];

// The columns a header may sort on, matching the keys actions.ts declared.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "supplier",
  invoiceDate: "invoiceDate",
  expirationDate: "expirationDate",
  invoiceTotal: "invoiceTotal",
};

type Props = {
  page: Paged<PurchaseInvoiceListItem>;
  filters: TableFilterControl[];
};

export const PurchaseInvoicesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (inv: PurchaseInvoiceListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            <Link
              href={`/purchase-invoices/${inv.uuid}`}
              className="underline-offset-4 hover:underline"
            >
              {inv.id}
            </Link>
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.companyName ?? "—"}
          </TableCell>
        );
      case "sentBy":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {[inv.contactFirstName, inv.contactLastName]
              .filter(Boolean)
              .join(" ") || "—"}
          </TableCell>
        );
      case "supplierCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.supplierCode ?? "—"}
          </TableCell>
        );
      case "invoiceDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.invoiceDate?.toLocaleDateString() ?? "—"}
          </TableCell>
        );
      case "expirationDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.expirationDate?.toLocaleDateString() ?? "—"}
          </TableCell>
        );
      case "invoiceTotal":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            € {inv.invoiceTotal}
          </TableCell>
        );
      case "paymentTerms":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.paymentTerms
              ? INVOICE_PAYMENT_TERM_LABELS[inv.paymentTerms]
              : "—"}
          </TableCell>
        );
      case "blocked":
        return (
          <TableCell key={key}>
            {inv.blocked ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Blocked
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </TableCell>
        );
      case "blockReason":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.blockReason
              ? PURCHASE_INVOICE_BLOCK_REASON_LABELS[inv.blockReason]
              : "—"}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search supplier invoice number or supplier…"
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
      </TableToolbar>

      <div>
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
                  className="h-24 text-center"
                >
                  No purchase invoices found.
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((inv) => (
                <TableRow key={inv.uuid}>
                  {visibleColumns.map((col) => renderCell(inv, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        singular="purchase invoice"
        plural="purchase invoices"
      />
    </div>
  );
};
