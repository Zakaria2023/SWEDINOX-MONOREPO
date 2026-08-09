"use client";

import Link from "next/link";
import {
  exportInvoices,
  InvoiceWithCompany,
} from "@/app/(dashboard)/invoices/actions";
import {
  INVOICE_COLUMNS,
  InvoiceColumnKey,
} from "@/app/(dashboard)/invoices/columns";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { Paged, TableFilterControl } from "@/lib/table-query";
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

type ColumnKey = InvoiceColumnKey;

// The column selector and the export read the same declaration — see
// app/(dashboard)/invoices/columns.ts — so a column cannot be on screen and
// missing from the file.
const ALL_COLUMNS = selectorColumns(INVOICE_COLUMNS);

// The columns a header may sort on, matching the keys actions.ts declared
// sortable. Anything not named here renders as a plain header.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  documentType: "documentType",
  companyName: "customer",
  invoiceDate: "invoiceDate",
  expirationDate: "expirationDate",
  invoiceTotal: "invoiceTotal",
  outstanding: "outstanding",
};

type Props = {
  page: Paged<InvoiceWithCompany>;
  filters: TableFilterControl[];
};

export const InvoicesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

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
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.companyName ?? "—"}
          </TableCell>
        );
      case "companyCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.companyCode ?? "—"}
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
      case "invoiceAmountExclVat":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            € {inv.invoiceAmountExclVat}
          </TableCell>
        );
      case "invoiceAmountInclVat":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            € {inv.invoiceAmountInclVat}
          </TableCell>
        );
      case "creditRestriction":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            € {inv.creditRestriction}
          </TableCell>
        );
      case "invoiceTotal":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            € {inv.invoiceTotal}
          </TableCell>
        );
      case "outstanding":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            € {inv.outstanding}
          </TableCell>
        );
      case "vatScenario":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {inv.vatScenario
              ? INVOICE_VAT_SCENARIO_LABELS[inv.vatScenario]
              : "—"}
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
      <TableToolbar
        searchPlaceholder="Search debtor, explanation or customer…"
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
          fileName="invoices"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportInvoices}
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
                  No invoices found.
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
      <TablePagination page={page} singular="invoice" plural="invoices" />
    </div>
  );
};
