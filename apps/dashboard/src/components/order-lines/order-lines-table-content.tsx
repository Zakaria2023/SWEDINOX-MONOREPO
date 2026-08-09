"use client";

import Link from "next/link";
import {
  exportOrderLines,
  OrderLineRow,
} from "@/app/(dashboard)/order-lines/actions";
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
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  orderLineStatusLabel,
  userName,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<OrderLineRow>;
  filters: TableFilterControl[];
  /** Clerk id -> name, for the seller column. */
  userNames: Record<string, string>;
};

export const OrderLinesTable = ({ page, filters, userNames }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search product, reference or customer…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="order-lines"
        action={exportOrderLines}
      />
    </TableToolbar>
    <Table>
      <TableHeader>
        <TableRow>
          <TableSortHeader sortKey="createdAt">Creation date</TableSortHeader>
          <TableSortHeader sortKey="deliveryDate">
            Delivery date
          </TableSortHeader>
          <TableSortHeader sortKey="customer">Customer</TableSortHeader>
          <TableHead>Reference</TableHead>
          <TableSortHeader sortKey="order" className="text-right">
            Order
          </TableSortHeader>
          <TableHead className="text-right">Line</TableHead>
          <TableSortHeader sortKey="lineStatus">Line status</TableSortHeader>
          <TableSortHeader sortKey="productCode">Product code</TableSortHeader>
          <TableHead>Description</TableHead>
          <TableHead>Options</TableHead>
          <TableHead className="text-right">Length (mm)</TableHead>
          <TableHead className="text-right">Width (mm)</TableHead>
          <TableHead className="text-right">Thick. (mm)</TableHead>
          <TableSortHeader sortKey="quantity" className="text-right">
            Quantity
          </TableSortHeader>
          <TableHead>QtyU</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Cost price</TableHead>
          <TableSortHeader sortKey="amount" className="text-right">
            Amount
          </TableSortHeader>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit margin</TableHead>
          <TableHead>Seller</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={22}
              className="h-24 text-center text-muted-foreground"
            >
              No order lines found.
            </TableCell>
          </TableRow>
        ) : (
          page.rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium whitespace-nowrap">
                <Link
                  href={`/order-lines/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {formatDateValue(row.createdAt)}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.deliveryDate)}
              </TableCell>
              <TableCell className="font-medium">
                {row.customerName ?? "—"}
              </TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="text-right">{row.orderId ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>{orderLineStatusLabel(row.lineStatus)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell>{row.options ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lengthMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.thicknessMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.quantity)}
              </TableCell>
              <TableCell>{row.unit?.toUpperCase() ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.price)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.costPrice)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.amount)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.profit)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.profitMargin)}%
              </TableCell>
              <TableCell>{userName(row.seller, userNames)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    <TablePagination page={page} singular="order line" plural="order lines" />
  </div>
);
