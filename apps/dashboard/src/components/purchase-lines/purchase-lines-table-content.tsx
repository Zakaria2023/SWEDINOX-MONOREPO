"use client";

import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";
import Link from "next/link";
import { PurchaseLineItem } from "@/app/(dashboard)/purchase-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ORDER_LINE_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  page: Paged<PurchaseLineItem>;
  filters: TableFilterControl[];
};

export const PurchaseLinesTable = ({ page, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search product or supplier…"
      filters={filters}
    />
    <Table>
      <TableHeader>
        <TableRow>
          <TableSortHeader sortKey="createdAt">Date created</TableSortHeader>
          <TableHead className="text-right">Purchase order</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Status</TableHead>
          <TableSortHeader sortKey="supplier">Supplier</TableSortHeader>
          <TableSortHeader sortKey="productCode">Product code</TableSortHeader>
          <TableHead>Product</TableHead>
          <TableHead>Quality</TableHead>
          <TableHead>Stock category</TableHead>
          <TableHead>Options</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead className="text-right">Qty(p)</TableHead>
          <TableHead>U</TableHead>
          <TableHead className="text-right">Reserved</TableHead>
          <TableHead className="text-right">Kg(pur)</TableHead>
          <TableHead>Receipt date</TableHead>
          <TableHead>Purchaser</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={18}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase lines found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/purchase-lines/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.purchaseOrderId ?? `#${row.id}`}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>
                <StatusBadge
                  value={row.status}
                  label={
                    row.status ? ORDER_LINE_STATUS_LABELS[row.status] : null
                  }
                />
              </TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell>{row.qualityCode ?? "—"}</TableCell>
              <TableCell>{row.stockCategory ?? "—"}</TableCell>
              <TableCell>{row.options ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lengthMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyPlanned}</TableCell>
              <TableCell>
                {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
              </TableCell>
              <TableCell className="text-right">{row.reservedQty}</TableCell>
              <TableCell className="text-right">{row.kgPurchased}</TableCell>
              <TableCell>{row.receiptDate ?? "—"}</TableCell>
              <TableCell>{row.purchaser ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    <TablePagination
      page={page}
      singular="purchase line"
      plural="purchase lines"
    />
  </div>
);
