"use client";

import { PurchaseQuoteLineItem } from "@/app/(dashboard)/purchase-quotes-overview/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ORDER_LINE_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  lines: PurchaseQuoteLineItem[];
};

const formatDate = (value: Date | string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

export const PurchaseQuotesOverviewTable = ({ lines }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Supplier</TableHead>
          <TableHead>Quote date</TableHead>
          <TableHead>Valid u/i</TableHead>
          <TableHead>Quote nr. supplier</TableHead>
          <TableHead className="text-right">Purchase quote</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiration reason</TableHead>
          <TableHead className="text-right">Revenue group no.</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product description</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>QtyU</TableHead>
          <TableHead className="text-right">Kg</TableHead>
          <TableHead className="text-right">Net price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Purchaser</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={20}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase quotes found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                {row.supplierName ?? "—"}
              </TableCell>
              <TableCell>{formatDate(row.quoteDate)}</TableCell>
              <TableCell>{formatDate(row.validUntil)}</TableCell>
              <TableCell>{row.quoteNumberSupplier ?? "—"}</TableCell>
              <TableCell className="text-right">{row.quoteId ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>
                {row.status ? ORDER_LINE_STATUS_LABELS[row.status] : "—"}
              </TableCell>
              <TableCell>{row.expirationReason ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell className="text-right">{row.lengthMm ?? "—"}</TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell>{row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}</TableCell>
              <TableCell className="text-right">{row.kg}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.netPrice}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.amount}
              </TableCell>
              <TableCell>{row.purchaser ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
