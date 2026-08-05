"use client";

import { PurchaseInvoiceToReceiveRow } from "@/app/(dashboard)/purchase-invoices-to-be-received/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateColumn, formatMoney } from "@/lib/helpers";
import { INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";

type Props = {
  rows: PurchaseInvoiceToReceiveRow[];
};

export const PurchaseInvoicesToBeReceivedTable = ({ rows }: Props) => {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Purchase order</TableHead>
            <TableHead className="text-right">Company code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Order date</TableHead>
            <TableHead>Payment terms</TableHead>
            <TableHead>Scheduled delivery</TableHead>
            <TableHead>Actual delivery</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center text-muted-foreground"
              >
                No purchase invoices awaited.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row) => (
                <TableRow key={row.purchaseOrderUuid}>
                  <TableCell className="font-medium">
                    {row.supplierName ?? "—"}
                  </TableCell>
                  <TableCell>{row.reference ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {row.companyCode ?? "—"}
                  </TableCell>
                  <TableCell>{row.city ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateColumn(row.orderDate)}
                  </TableCell>
                  <TableCell>
                    {row.paymentTerms
                      ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms]
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateColumn(row.scheduledDeliveryDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateColumn(row.actualDeliveryDate)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold [&>td]:border-t-2 [&>td]:border-border">
                <TableCell colSpan={8}>Total</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(total)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
