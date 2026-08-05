"use client";

import Link from "next/link";
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
import { buildColumnVisibility, invoiceReference } from "@/lib/helpers";
import {
  INVOICE_DOCUMENT_TYPE_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
} from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "documentType"
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
  { key: "id", label: "Document No.", defaultVisible: true },
  { key: "documentType", label: "Document", defaultVisible: true },
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

type Props = { invoices: InvoiceWithCompany[] };

export const InvoicesTable = ({ invoices }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (inv: InvoiceWithCompany, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            <Link
              href={`/invoices/${inv.uuid}`}
              className="underline-offset-4 hover:underline"
            >
              {invoiceReference(inv.documentType, inv.id)}
            </Link>
          </TableCell>
        );
      // A credit note sits in the same list as the invoices it offsets, so it
      // has to say which it is — its negative amounts read as errors otherwise.
      case "documentType":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.documentType === "credit_note" ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {INVOICE_DOCUMENT_TYPE_LABELS.credit_note}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {INVOICE_DOCUMENT_TYPE_LABELS.invoice}
              </span>
            )}
          </TableCell>
        );
      case "companyName":
        return <TableCell key={key} className="whitespace-nowrap">{inv.companyName ?? "—"}</TableCell>;
      case "companyCode":
        return <TableCell key={key} className="whitespace-nowrap">{inv.companyCode ?? "—"}</TableCell>;
      case "invoiceDate":
        return <TableCell key={key} className="whitespace-nowrap">{inv.invoiceDate?.toLocaleDateString() ?? "—"}</TableCell>;
      case "expirationDate":
        return <TableCell key={key} className="whitespace-nowrap">{inv.expirationDate?.toLocaleDateString() ?? "—"}</TableCell>;
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
            {inv.vatScenario ? INVOICE_VAT_SCENARIO_LABELS[inv.vatScenario] : "—"}
          </TableCell>
        );
      case "paymentTerms":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[inv.paymentTerms] : "—"}
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

      <div>
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
