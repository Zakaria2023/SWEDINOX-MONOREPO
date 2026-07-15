"use client";

import { useState, useTransition } from "react";
import {
  cancelPurchaseInvoice,
  PurchaseInvoiceDetail,
} from "@/app/(dashboard)/purchase-invoices/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";

type Props = {
  purchaseInvoice: PurchaseInvoiceDetail;
};

export const PurchaseInvoiceDetailView = ({ purchaseInvoice }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelPurchaseInvoice(purchaseInvoice.uuid);
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
            Company
          </p>
          <p className="text-sm">{purchaseInvoice.companyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice Sent By
          </p>
          <p className="text-sm">
            {[
              purchaseInvoice.contactFirstName,
              purchaseInvoice.contactLastName,
            ]
              .filter(Boolean)
              .join(" ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm">
            {purchaseInvoice.cancelled ? "Cancelled" : "Active"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice Date
          </p>
          <p className="text-sm">
            {purchaseInvoice.invoiceDate?.toLocaleDateString("en-GB") ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice Number (Supplier)
          </p>
          <p className="text-sm">
            {purchaseInvoice.invoiceNumberSupplier ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invoice Total
          </p>
          <p className="text-sm">€{purchaseInvoice.invoiceTotal}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Stock Items Taken
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseInvoice.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No stock items on this invoice.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseInvoice.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ")}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!purchaseInvoice.cancelled && (
        <div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending}
          >
            Cancel Purchase Invoice
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleCancel}
        isPending={isPending}
        title="Cancel purchase invoice"
        description="This cancels the invoice and restores its stock items back to pending. This cannot be undone."
        confirmLabel="Cancel Invoice"
      />
    </div>
  );
};
