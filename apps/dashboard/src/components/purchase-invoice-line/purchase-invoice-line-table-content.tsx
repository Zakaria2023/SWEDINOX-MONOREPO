"use client";

import { PurchaseInvoiceLineRow } from "@/app/(dashboard)/purchase-invoice-line/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type Props = {
  rows: PurchaseInvoiceLineRow[];
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

const yearOf = (date: string | Date | null) =>
  date ? new Date(date).getFullYear() : "—";
const monthOf = (date: string | Date | null) =>
  date ? new Date(date).getMonth() + 1 : "—";

export const PurchaseInvoiceLineTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
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
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="text-right">
                {yearOf(row.invoiceDate)}
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
                {number(Number(row.quantity ?? 0))}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenue)}
              </TableCell>
              <TableCell>{row.vatNumber ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
