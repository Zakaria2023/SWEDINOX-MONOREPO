"use client";

import { InvoiceWithCompany } from "@/app/(dashboard)/invoices/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  COMMON_TEXT,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
} from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "companyName"
  | "companyCode"
  | "invoiceDate"
  | "expirationDate"
  | "invoiceAmountExclVat"
  | "invoiceAmountInclVat"
  | "creditRestriction"
  | "invoiceTotal"
  | "outstanding"
  | "vatScenario"
  | "paymentTerms"
  | "status";

const ALL_COLUMNS: Array<{ key: ColumnKey; label: string; defaultVisible: boolean }> = [
  { key: "id", label: "Invoice No.", defaultVisible: true },
  { key: "companyName", label: "Customer", defaultVisible: true },
  { key: "companyCode", label: "Customer Code", defaultVisible: true },
  { key: "invoiceDate", label: "Invoice Date", defaultVisible: true },
  { key: "expirationDate", label: "Expiration Date", defaultVisible: true },
  { key: "invoiceAmountExclVat", label: "Excl. VAT", defaultVisible: true },
  { key: "invoiceAmountInclVat", label: "Incl. VAT", defaultVisible: true },
  { key: "creditRestriction", label: "Credit Restriction", defaultVisible: false },
  { key: "invoiceTotal", label: "Total", defaultVisible: true },
  { key: "outstanding", label: "Outstanding", defaultVisible: true },
  { key: "vatScenario", label: "VAT Scenario", defaultVisible: true },
  { key: "paymentTerms", label: "Payment Terms", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type Props = { invoices: InvoiceWithCompany[] };

export const InvoicesTable = ({ invoices }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);
  const na = COMMON_TEXT.notAvailable;

  const renderCell = (inv: InvoiceWithCompany, key: ColumnKey) => {
    switch (key) {
      case "id":
        return <TableCell key={key} className="font-medium whitespace-nowrap">{inv.id}</TableCell>;
      case "companyName":
        return <TableCell key={key} className="whitespace-nowrap">{inv.companyName ?? na}</TableCell>;
      case "companyCode":
        return <TableCell key={key} className="whitespace-nowrap">{inv.companyCode ?? na}</TableCell>;
      case "invoiceDate":
        return <TableCell key={key} className="whitespace-nowrap">{inv.invoiceDate?.toLocaleDateString() ?? na}</TableCell>;
      case "expirationDate":
        return <TableCell key={key} className="whitespace-nowrap">{inv.expirationDate?.toLocaleDateString() ?? na}</TableCell>;
      case "invoiceAmountExclVat":
        return <TableCell key={key} className="text-right whitespace-nowrap">€ {inv.invoiceAmountExclVat}</TableCell>;
      case "invoiceAmountInclVat":
        return <TableCell key={key} className="text-right whitespace-nowrap">€ {inv.invoiceAmountInclVat}</TableCell>;
      case "creditRestriction":
        return <TableCell key={key} className="text-right whitespace-nowrap">€ {inv.creditRestriction}</TableCell>;
      case "invoiceTotal":
        return <TableCell key={key} className="text-right whitespace-nowrap">€ {inv.invoiceTotal}</TableCell>;
      case "outstanding":
        return <TableCell key={key} className="text-right whitespace-nowrap">€ {inv.outstanding}</TableCell>;
      case "vatScenario":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.vatScenario ? INVOICE_VAT_SCENARIO_LABELS[inv.vatScenario] : na}
          </TableCell>
        );
      case "paymentTerms":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[inv.paymentTerms] : na}
          </TableCell>
        );
      case "status":
        return (
          <TableCell key={key}>
            <div className="flex gap-1">
              {inv.calculateVat && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  VAT
                </span>
              )}
              {inv.printed && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Printed
                </span>
              )}
              {inv.mailed && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Mailed
                </span>
              )}
              {!inv.calculateVat && !inv.printed && !inv.mailed && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
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
                  No invoices found.
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
