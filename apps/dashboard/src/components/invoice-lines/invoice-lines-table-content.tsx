"use client";

import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";
import Link from "next/link";
import {
  exportInvoiceLines,
  InvoiceLineItem,
} from "@/app/(dashboard)/invoice-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  page: Paged<InvoiceLineItem>;
  filters: TableFilterControl[];
};

export const InvoiceLinesTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search product or customer…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="invoice-lines"
        action={exportInvoiceLines}
      />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Invoice no.</TableHead>
          <TableSortHeader sortKey="invoiceDate">Invoice date</TableSortHeader>
          <TableHead className="text-right">Order line</TableHead>
          <TableSortHeader sortKey="customer">Customer</TableSortHeader>
          <TableSortHeader sortKey="productCode">Product code</TableSortHeader>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead>VAT number</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={10}
              className="h-24 text-center text-muted-foreground"
            >
              No invoice lines found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/invoice-lines/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.invoiceId ?? `#${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{formatDateValue(row.invoiceDate)}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>{row.customerName ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell className="text-right">
                {row.weightKg ?? "—"}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.amount ?? "0.00"}
              </TableCell>
              <TableCell>{row.vatNumber ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    <TablePagination
      page={page}
      singular="invoice line"
      plural="invoice lines"
    />
  </div>
);
