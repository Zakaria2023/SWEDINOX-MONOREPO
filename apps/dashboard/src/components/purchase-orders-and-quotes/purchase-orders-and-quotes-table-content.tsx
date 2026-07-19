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
import { PurchaseOrderStatus } from "@/lib/enums";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  rows: PurchaseOrderQuoteRow[];
};

const money = (value: number) =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const number = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const fmtDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

const statusLabel = (value: PurchaseOrderStatus | null) =>
  value ? (PURCHASE_ORDER_STATUS_LABELS[value] ?? value) : "—";

export const PurchaseOrdersAndQuotesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
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
                {fmtDate(row.createdAt)}
              </TableCell>
              <TableCell>{row.purchaser ?? "—"}</TableCell>
              <TableCell>{statusLabel(row.status)}</TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.supplierName ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {number(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenue)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
