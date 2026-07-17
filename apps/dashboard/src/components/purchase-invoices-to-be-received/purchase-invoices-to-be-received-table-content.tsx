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
import { INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";

type Props = {
  rows: PurchaseInvoiceToReceiveRow[];
};

const money = (value: number) =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (value: string | Date | null) => {
  if (!value) {
    return "—";
  }
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
};

export const PurchaseInvoicesToBeReceivedTable = ({ rows }: Props) => {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="overflow-x-auto rounded-md border">
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
                    {fmtDate(row.orderDate)}
                  </TableCell>
                  <TableCell>
                    {row.paymentTerms
                      ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms]
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fmtDate(row.scheduledDeliveryDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fmtDate(row.actualDeliveryDate)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {money(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-semibold">
                <TableCell colSpan={8}>Total</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {money(total)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
