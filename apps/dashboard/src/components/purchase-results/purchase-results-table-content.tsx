"use client";

import {
  exportPurchaseResults,
  PurchaseResultRow,
} from "@/app/(dashboard)/purchase-results/actions";
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
import { formatDateColumn, formatMoney } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<PurchaseResultRow>;
  filters: TableFilterControl[];
};

export const PurchaseResultsTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar searchPlaceholder="Search product or group…" filters={filters}>
      <PagedTableExportButton
        fileName="purchase-results"
        action={exportPurchaseResults}
      />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Main group</TableHead>
          <TableHead>Subgroup</TableHead>
          <TableSortHeader sortKey="productCode">Product code</TableSortHeader>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableSortHeader sortKey="receiptDate">Receipt date</TableSortHeader>
          <TableSortHeader sortKey="purchaseValue" className="text-right">
            Purchase value
          </TableSortHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase results found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{row.mainGroup ?? "—"}</TableCell>
              <TableCell>{row.subgroup ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.year ?? "—"}</TableCell>
              <TableCell className="text-right">{row.month ?? "—"}</TableCell>
              <TableCell>{formatDateColumn(row.receiptDate)}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.purchaseValue)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    <TablePagination
      page={page}
      singular="purchase result"
      plural="purchase results"
    />
  </div>
);
