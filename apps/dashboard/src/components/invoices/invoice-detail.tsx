"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cancelInvoice, InvoiceDetail } from "@/app/(dashboard)/invoices/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { InvoicePaymentsSection } from "@/components/invoices/sections/invoice-payments-section";
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import {
  formatMoney,
  invoiceReference,
  invoiceSummaryFromSnapshot,
} from "@/lib/helpers";
import { INVOICE_DOCUMENT_TYPE_LABELS } from "@/lib/labels";

type Props = {
  invoice: InvoiceDetail;
};

export const InvoiceDetailView = ({ invoice }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelInvoice(invoice.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer
          </p>
          <p className="text-sm">{invoice.companyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Document
          </p>
          <p className="text-sm">
            {INVOICE_DOCUMENT_TYPE_LABELS[invoice.documentType]}{" "}
            <span className="text-muted-foreground">
              {invoiceReference(invoice.documentType, invoice.id)}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm">
            {invoice.cancelled ? "Cancelled" : "Active"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice Date
          </p>
          <p className="text-sm">
            {invoice.invoiceDate?.toLocaleDateString("en-GB") ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Total (Incl. VAT)
          </p>
          <p className="text-sm">€{invoice.invoiceAmountInclVat}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Credit Restriction
          </p>
          <p className="text-sm">€{invoice.creditRestriction}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Outstanding
          </p>
          <p className="text-sm">€{invoice.outstanding}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Stock Items Billed
        </h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Weight (kg)</TableHead>
                <TableHead className="text-right">Net Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No stock items on this invoice.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.weightKg ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.netPrice ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.amount ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.costAmount ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.profit ?? 0))}{" "}
                      <span className="text-muted-foreground">
                        ({item.profitMargin ?? "0.00"}%)
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <QuoteSummaryPanel summary={invoiceSummaryFromSnapshot(invoice)} />

      <InvoicePaymentsSection
        invoiceUuid={invoice.uuid}
        outstanding={invoice.outstanding}
        cancelled={invoice.cancelled}
        documentType={invoice.documentType}
        payments={invoice.payments}
      />

      {!invoice.cancelled && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/invoices/${invoice.uuid}/edit`} />}
          >
            Edit Details
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending}
          >
            Cancel Invoice
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleCancel}
        isPending={isPending}
        title="Cancel invoice"
        description="This cancels the invoice and restores its stock items back to reserved. This cannot be undone."
        confirmLabel="Cancel Invoice"
      />
    </div>
  );
};
