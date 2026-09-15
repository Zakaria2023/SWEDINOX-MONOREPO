"use client";

import Link from "next/link";
import {
  exportPurchaseQuoteLines,
  PurchaseQuoteLineRow,
} from "@/app/(dashboard)/purchase-quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { formatDateColumn, formatMoney, formatNumber } from "@/lib/helpers";
import {
  PURCHASE_QUOTE_EXPIRATION_REASON_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<PurchaseQuoteLineRow>;
  filters: TableFilterControl[];
};

const numberOrDash = (value: string | number | null): string =>
  value === null ? "—" : formatNumber(Number(value));

export const PurchaseQuotesTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search product, supplier or quote no…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="purchase-quotes"
        action={exportPurchaseQuoteLines}
      />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableSortHeader sortKey="supplier">Supplier</TableSortHeader>
          <TableSortHeader sortKey="quoteDate">Quote date</TableSortHeader>
          <TableSortHeader sortKey="validUntil">Valid u/i</TableSortHeader>
          <TableHead>Quote nr. supplier</TableHead>
          <TableSortHeader sortKey="quote">Purchase quote</TableSortHeader>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiration reason</TableHead>
          <TableHead>Revenue group number</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product description</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>QtyU</TableHead>
          <TableHead className="text-right">Kg</TableHead>
          <TableHead className="text-right">Net price</TableHead>
          <TableHead>PriceU</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Company code</TableHead>
          <TableHead>Internal Text</TableHead>
          <TableHead>Consignation</TableHead>
          <TableHead>Initials purchaser</TableHead>
          <TableHead>Purchaser</TableHead>
          <TableHead>Our reference</TableHead>
          <TableHead>Purchase Reference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={27}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase quotes found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.lineUuid ?? row.quoteUuid}>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell>{formatDateColumn(row.quoteDate)}</TableCell>
              <TableCell>{formatDateColumn(row.validUntil)}</TableCell>
              <TableCell>{row.quoteNumber ?? "—"}</TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/purchase-quotes/${row.quoteUuid}`}
                  className="text-primary hover:underline"
                >
                  {row.quoteId}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>
                <StatusBadge
                  value={row.status}
                  label={PURCHASE_QUOTE_STATUS_LABELS[row.status]}
                />
              </TableCell>
              <TableCell>
                {row.expirationReason
                  ? PURCHASE_QUOTE_EXPIRATION_REASON_LABELS[row.expirationReason]
                  : "—"}
              </TableCell>
              <TableCell>{row.revenueGroupNumber ?? "—"}</TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell>{row.productCode ?? "—"}</TableCell>
              <TableCell>{row.productDescription ?? "—"}</TableCell>
              <TableCell className="text-right">
                {numberOrDash(row.lengthMm)}
              </TableCell>
              <TableCell className="text-right">
                {numberOrDash(row.widthMm)}
              </TableCell>
              <TableCell className="text-right">
                {numberOrDash(row.quantity)}
              </TableCell>
              <TableCell>
                {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
              </TableCell>
              <TableCell className="text-right">
                {numberOrDash(row.kg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {row.netPrice === null ? "—" : formatMoney(Number(row.netPrice))}
              </TableCell>
              <TableCell>{row.priceUnit ?? "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {row.amount === null ? "—" : formatMoney(Number(row.amount))}
              </TableCell>
              <TableCell className="text-right">
                {row.companyCode ?? "—"}
              </TableCell>
              <TableCell>{row.internalText ?? "—"}</TableCell>
              <TableCell>{row.isConsignment ? "Yes" : "No"}</TableCell>
              <TableCell>{row.purchaserInitials ?? "—"}</TableCell>
              <TableCell>{row.purchaser ?? "—"}</TableCell>
              <TableCell>{row.ourReference ?? "—"}</TableCell>
              <TableCell>{row.purchaseReference ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    <TablePagination
      page={page}
      singular="quote line"
      plural="quote lines"
    />
  </div>
);
