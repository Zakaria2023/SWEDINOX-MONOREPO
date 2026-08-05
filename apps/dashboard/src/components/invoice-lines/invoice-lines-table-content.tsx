"use client";

import Link from "next/link";
import { InvoiceLineItem } from "@/app/(dashboard)/invoice-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  lines: InvoiceLineItem[];
};

export const InvoiceLinesTable = ({ lines }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Invoice no.</TableHead>
          <TableHead>Invoice date</TableHead>
          <TableHead className="text-right">Order line</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead>VAT number</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={10}
              className="h-24 text-center text-muted-foreground"
            >
              No invoice lines found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/invoice-lines/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.invoiceId ?? `#${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{formatDateValue(row.invoiceDate)}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>{row.customerName ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell className="text-right">
                {row.weightKg ?? "—"}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.amount ?? "0.00"}
              </TableCell>
              <TableCell>{row.vatNumber ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
