"use client";

import Link from "next/link";
import { OrderOrQuoteRow } from "@/app/(dashboard)/orders-and-quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  orDash,
  userName,
} from "@/lib/helpers";
import {
  ORDER_STATUS_LABELS,
  SALES_DOCUMENT_KIND_LABELS,
} from "@/lib/labels";
import { OrderStatus } from "@/lib/enums";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: OrderOrQuoteRow[];
  /** Clerk id -> name, for the seller column. */
  userNames: Record<string, string>;
};

/**
 * Return orders and counter orders run their own status lists, so anything the
 * sales ladder does not name is shown as the reference stores it rather than
 * blanked.
 */
const statusLabel = (status: string | null): string | null => {
  if (!status) {
    return null;
  }
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
};

export const OrdersAndQuotesTable = ({ rows, userNames }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="orders-and-quotes-table"
          fileName="orders-and-quotes"
          sheetName="Orders and Quotes"
        />
      </div>
      <Table id="orders-and-quotes-table">
        <TableHeader>
          <TableRow>
            <TableHead>Creation date</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Order / Quote</TableHead>
            <TableHead className="text-right">Lines</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order type</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit margin</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Converted from / to</TableHead>
            <TableHead>Quote date</TableHead>
            <TableHead>Decision date</TableHead>
            <TableHead>Valid u/i</TableHead>
            <TableHead>Expiration reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={19}
                className="h-24 text-center text-muted-foreground"
              >
                No orders or quotes found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={`${row.kind}-${row.uuid}`}>
                <TableCell>{formatDateColumn(row.createdAt)}</TableCell>
                <TableCell>{formatDateColumn(row.deliveryDate)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {SALES_DOCUMENT_KIND_LABELS[row.kind]}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  <Link
                    href={row.href}
                    className="text-primary hover:underline"
                  >
                    {row.documentCode}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.lineCount}
                </TableCell>
                <TableCell>{orDash(statusLabel(row.status))}</TableCell>
                <TableCell>{row.orderType}</TableCell>
                <TableCell>{orDash(row.customerName)}</TableCell>
                <TableCell>{orDash(row.reference)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.weightKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(row.profitMargin)}
                </TableCell>
                <TableCell>{userName(row.seller, userNames)}</TableCell>
                <TableCell>{orDash(row.convertedFromTo)}</TableCell>
                <TableCell>{formatDateColumn(row.quoteDate)}</TableCell>
                <TableCell>{formatDateColumn(row.decisionDate)}</TableCell>
                <TableCell>{formatDateColumn(row.validUntil)}</TableCell>
                <TableCell>{orDash(row.expirationReason)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
