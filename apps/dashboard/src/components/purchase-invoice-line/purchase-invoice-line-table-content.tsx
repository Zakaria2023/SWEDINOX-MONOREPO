"use client";

import Link from "next/link";
import { PurchaseInvoiceLineRow } from "@/app/(dashboard)/purchase-invoice-line/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber, monthOf, yearOf } from "@/lib/helpers";

type Props = {
  rows: PurchaseInvoiceLineRow[];
};

export const PurchaseInvoiceLineTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead className="text-right">Invoice</TableHead>
          <TableHead>Purchase order</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Revenue products</TableHead>
          <TableHead>VAT number</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={11}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase invoice lines found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/purchase-invoice-line/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {yearOf(row.invoiceDate)}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {monthOf(row.invoiceDate)}
              </TableCell>
              <TableCell className="text-right">
                {row.invoiceId ?? "—"}
              </TableCell>
              <TableCell>{row.purchaseOrderNumber ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.supplierName ?? "—"}
              </TableCell>
              <TableCell>{row.country ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.quantity ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenue)}
              </TableCell>
              <TableCell>{row.vatNumber ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
