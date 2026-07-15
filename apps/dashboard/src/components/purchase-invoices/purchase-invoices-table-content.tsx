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
import { buildColumnVisibility } from "@/lib/helpers";
import {
  COMMON_TEXT,
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

const ALL_COLUMNS: Array<{ key: ColumnKey; label: string; defaultVisible: boolean }> = [
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

type Props = { invoices: PurchaseInvoiceListItem[] };

export const PurchaseInvoicesTable = ({ invoices }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);
  const na = COMMON_TEXT.notAvailable;

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
        return <TableCell key={key} className="whitespace-nowrap">{inv.companyName ?? na}</TableCell>;
      case "sentBy":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {[inv.contactFirstName, inv.contactLastName].filter(Boolean).join(" ") || na}
          </TableCell>
        );
      case "supplierCode":
        return <TableCell key={key} className="whitespace-nowrap">{inv.supplierCode ?? na}</TableCell>;
      case "invoiceDate":
        return <TableCell key={key} className="whitespace-nowrap">{inv.invoiceDate?.toLocaleDateString() ?? na}</TableCell>;
      case "expirationDate":
        return <TableCell key={key} className="whitespace-nowrap">{inv.expirationDate?.toLocaleDateString() ?? na}</TableCell>;
      case "invoiceTotal":
        return <TableCell key={key} className="text-right whitespace-nowrap">€ {inv.invoiceTotal}</TableCell>;
      case "paymentTerms":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[inv.paymentTerms] : na}
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
            {inv.blockReason ? PURCHASE_INVOICE_BLOCK_REASON_LABELS[inv.blockReason] : na}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({ key: col.key, label: col.label }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No purchase invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.uuid}>
                  {visibleColumns.map((col) => renderCell(inv, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
