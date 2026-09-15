"use client";

import Link from "next/link";
import {
  exportPurchaseInvoiceLines,
  PurchaseInvoiceLinesPage,
} from "@/app/(dashboard)/purchase-invoice-line/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { formatMoney, formatNumber } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

type Props = {
  page: PurchaseInvoiceLinesPage;
  filters: TableFilterControl[];
};

export const PurchaseInvoiceLineTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search product, CBS no. or supplier…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="purchase-invoice-line"
        action={exportPurchaseInvoiceLines}
      />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableSortHeader sortKey="invoiceDate">Year</TableSortHeader>
          <TableHead className="text-right">Month</TableHead>
          <TableHead>Purchase order</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableSortHeader sortKey="commodityCode">CBS no.</TableSortHeader>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Weight</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Revenue products</TableHead>
          <TableHead>VAT number</TableHead>
          <TableHead className="text-right">Invoice</TableHead>
          <TableSortHeader sortKey="supplier">Supplier</TableSortHeader>
          <TableSortHeader sortKey="productCode">Product code</TableSortHeader>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={14}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase invoice lines found.
            </TableCell>
          </TableRow>
        ) : (
          <>
            {page.rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell>{row.year ?? "—"}</TableCell>
                <TableCell className="text-right">{row.month ?? "—"}</TableCell>
                <TableCell>
                  {row.purchaseOrderId ?? row.purchaseOrderNumber ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.lineNumber ?? "—"}
                </TableCell>
                <TableCell>{row.commodityCode ?? "—"}</TableCell>
                <TableCell>{row.country ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightKg)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(Number(row.quantity))}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell>{row.vatNumber ?? "—"}</TableCell>
                <TableCell className="text-right font-medium">
                  <Link
                    href={`/purchase-invoice-line/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.invoiceId}
                  </Link>
                </TableCell>
                <TableCell>{row.supplierName ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell colSpan={6}>
                Total, all {formatNumber(page.total)} lines
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(page.totals.weightKg)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(page.totals.quantity)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(page.totals.amount)}
              </TableCell>
              <TableCell colSpan={5} />
            </TableRow>
          </>
        )}
      </TableBody>
    </Table>
    <TablePagination
      page={page}
      singular="purchase invoice line"
      plural="purchase invoice lines"
    />
  </div>
);
