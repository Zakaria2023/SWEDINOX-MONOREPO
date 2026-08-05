"use client";

import { PurchaseOrderQuoteRow } from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue, formatMoney, formatNumber, purchaseOrderStatusLabel } from "@/lib/helpers";

type Props = {
  rows: PurchaseOrderQuoteRow[];
};

export const PurchaseOrdersAndQuotesTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Number</TableHead>
          <TableHead>Creation date</TableHead>
          <TableHead>Purchaser</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase orders or quotes found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.kind}</TableCell>
              <TableCell className="text-right">{row.id ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.createdAt)}
              </TableCell>
              <TableCell>{row.purchaser ?? "—"}</TableCell>
              <TableCell>{purchaseOrderStatusLabel(row.status)}</TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.supplierName ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenue)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
