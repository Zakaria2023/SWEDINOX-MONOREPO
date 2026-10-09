"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  cancelPurchaseInvoice,
  PurchaseInvoiceDetail,
  releasePurchaseInvoice,
  setPurchaseInvoiceBlocked,
} from "@/app/(dashboard)/purchase-invoices/actions";
import { Button } from "@/components/shadcn/button";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailField } from "@/components/ui/detail-field";
import { FormError } from "@/components/ui/form-error";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { PurchaseInvoiceBlockReason, purchaseInvoiceBlockReasons } from "@/lib/enums";
import {
  enumOptions,
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatNumber,
} from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
  PURCHASE_INVOICE_STATUS_LABELS,
} from "@/lib/labels";
import { Ban, Check, ShieldCheck } from "lucide-react";

const blockReasonOptions = enumOptions(
  purchaseInvoiceBlockReasons,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
  "— Choose a reason —",
);

type Props = {
  purchaseInvoice: PurchaseInvoiceDetail;
};

export const PurchaseInvoiceDetailView = ({ purchaseInvoice }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [holdReason, setHoldReason] = useState("");

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  const totalReceived = purchaseInvoice.movements
    .filter((m) => m.type === "in")
    .reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalReversed = purchaseInvoice.movements
    .filter((m) => m.type === "out")
    .reduce((sum, m) => sum + Number(m.quantity), 0);
  const netReceived = totalReceived - totalReversed;

  // Booked: the details are fixed, a hold and a cancellation are not.
  const isBooked = purchaseInvoice.status === "released";
  const isClosed = purchaseInvoice.cancelled;

  const invoicedOrders = new Set(
    purchaseInvoice.items
      .map((item) => item.purchaseOrderUuid)
      .filter((orderUuid): orderUuid is string => orderUuid !== null),
  );
  const invoicedOrderUuid =
    invoicedOrders.size === 1 ? [...invoicedOrders][0] : null;

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      {/* `Show company · Show purchase order` on the reference's toolbar.
          An invoice billing lines of more than one order names none. */}
      <RelatedRecordsBar
        records={[
          {
            label: "Show company",
            href: purchaseInvoice.companyUuid
              ? `/companies/${purchaseInvoice.companyUuid}`
              : null,
          },
          {
            label: "Show purchase order",
            href: invoicedOrderUuid ? `/purchase-orders/${invoicedOrderUuid}` : null,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge
          value={purchaseInvoice.cancelled ? "cancelled" : purchaseInvoice.status}
          label={
            purchaseInvoice.cancelled
              ? "Cancelled"
              : PURCHASE_INVOICE_STATUS_LABELS[purchaseInvoice.status]
          }
        />
        {purchaseInvoice.blocked && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Held
            {purchaseInvoice.blockReason
              ? `: ${PURCHASE_INVOICE_BLOCK_REASON_LABELS[purchaseInvoice.blockReason]}`
              : ""}
          </span>
        )}
        {purchaseInvoice.statusChangedAt && (
          <p className="text-sm text-muted-foreground">
            Invoice status was last changed by{" "}
            {purchaseInvoice.statusChangedByName ?? "someone"} on{" "}
            {formatDateValue(purchaseInvoice.statusChangedAt)}.
          </p>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Invoice</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Company" value={purchaseInvoice.companyName} />
          <DetailField
            label="Invoice sent by"
            value={
              purchaseInvoice.sentByCompanyName ??
              [
                purchaseInvoice.contactFirstName,
                purchaseInvoice.contactLastName,
              ]
                .filter(Boolean)
                .join(" ")
            }
          />
          <DetailField label="Supplier code" value={purchaseInvoice.supplierCode} />
          <DetailField label="Creditor no." value={purchaseInvoice.creditorNo} />
          <DetailField label="City" value={purchaseInvoice.city} />
          <DetailField label="Country" value={purchaseInvoice.country} />
          <DetailField label="VAT number" value={purchaseInvoice.vatNumber} />
          <DetailField
            label="Invoice no. supplier"
            value={purchaseInvoice.invoiceNumberSupplier}
          />
          <DetailField
            label="Invoice date"
            value={formatDateColumn(purchaseInvoice.invoiceDate)}
          />
          <DetailField
            label="Exp. date"
            value={formatDateColumn(purchaseInvoice.expirationDate)}
          />
          <DetailField
            label="Booking date"
            value={formatDateColumn(purchaseInvoice.bookingDate)}
          />
          <DetailField
            label="Booking period"
            value={String(purchaseInvoice.bookingPeriod)}
          />
          <DetailField
            label="Payment terms"
            value={
              purchaseInvoice.paymentTerms
                ? INVOICE_PAYMENT_TERM_LABELS[purchaseInvoice.paymentTerms]
                : null
            }
          />
          <DetailField label="IBAN" value={purchaseInvoice.iban} />
          <DetailField label="Bank country" value={purchaseInvoice.bankCountry} />
          <DetailField
            label="Weight (kg)"
            value={formatNumber(purchaseInvoice.weightKg)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="Materials"
            value={formatMoney(Number(purchaseInvoice.materials ?? 0))}
          />
          <DetailField
            label="Options"
            value={formatMoney(Number(purchaseInvoice.optionsAmount ?? 0))}
          />
          <DetailField
            label="Surcharges"
            value={formatMoney(Number(purchaseInvoice.surcharges ?? 0))}
          />
          <DetailField
            label="VAT amount"
            value={formatMoney(purchaseInvoice.vatAmount)}
          />
          <DetailField
            label="Credit restriction"
            value={formatMoney(Number(purchaseInvoice.creditRestriction ?? 0))}
          />
          <DetailField
            label="Remainder"
            value={formatMoney(Number(purchaseInvoice.remainder ?? 0))}
          />
          <DetailField
            label="Invoice total"
            value={formatMoney(Number(purchaseInvoice.invoiceTotal ?? 0))}
          />
          <DetailField
            label="Outstanding"
            value={formatMoney(Number(purchaseInvoice.outstanding ?? 0))}
          />
        </div>
        {/* Only where this invoice actually moved stock. It does not any more —
            goods are booked in by the unloading work order and an invoice
            records that they have been paid for — so on anything raised now
            this read "Received 0 on 0 stock movements", which says the goods
            never arrived when they are on the shelf. Historic invoices that did
            move stock still show it. */}
        {purchaseInvoice.movements.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Received {formatNumber(netReceived)} on{" "}
            {purchaseInvoice.movements.length} stock movement
            {purchaseInvoice.movements.length === 1 ? "" : "s"}
            {totalReversed > 0
              ? ` (${formatNumber(totalReversed)} reversed)`
              : ""}
            .
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Lines</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase order</TableHead>
              <TableHead className="text-right">Line</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>U</TableHead>
              <TableHead className="text-right">Kg</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Per</TableHead>
              <TableHead className="text-right">Material</TableHead>
              <TableHead>VAT rate</TableHead>
              <TableHead>Delivery date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseInvoice.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="h-24 text-center text-muted-foreground"
                >
                  No lines on this invoice.
                </TableCell>
              </TableRow>
            ) : (
              purchaseInvoice.items.map((item) => (
                <TableRow key={item.uuid}>
                  <TableCell>{item.purchaseOrderId ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {item.lineNumber ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {[item.productCode, item.productName]
                      .filter(Boolean)
                      .join(" — ") || "—"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>{item.unit ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(item.weightKg)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.lengthMm ?? "—"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(Number(item.netPrice ?? 0))}
                  </TableCell>
                  <TableCell>{item.priceUnit ?? "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(Number(item.amount ?? 0))}
                  </TableCell>
                  <TableCell>{item.vatCode ?? "—"}</TableCell>
                  <TableCell>{formatDateColumn(item.deliveryDate)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {!isClosed && (
        <div className="flex flex-wrap items-end gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/purchase-invoices/${purchaseInvoice.uuid}/edit`} />
            }
          >
            Edit details
          </Button>

          {/* The reference's `Final`: books the invoice and releases it
              for payment, in one press. */}
          {purchaseInvoice.status === "provisional" && (
            <Button
              type="button"
              onClick={() => run(() => releasePurchaseInvoice(purchaseInvoice.uuid))}
              disabled={isPending}
            >
              <ShieldCheck className="mr-1.5 size-4" />
              Final
            </Button>
          )}

          {purchaseInvoice.blocked ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                run(() => setPurchaseInvoiceBlocked(purchaseInvoice.uuid, false))
              }
              disabled={isPending}
            >
              <Check className="mr-1.5 size-4" />
              Unblock
            </Button>
          ) : (
            <div className="flex items-end gap-2">
              <Select
                id="holdReason"
                value={holdReason}
                options={blockReasonOptions}
                onValueChange={setHoldReason}
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  run(() =>
                    setPurchaseInvoiceBlocked(
                      purchaseInvoice.uuid,
                      true,
                      (holdReason || null) as PurchaseInvoiceBlockReason | null,
                    ),
                  )
                }
                disabled={isPending}
              >
                <Ban className="mr-1.5 size-4" />
                Hold
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending}
          >
            Cancel purchase invoice
          </Button>
        </div>
      )}

      {isBooked && !purchaseInvoice.cancelled && (
        <p className="text-sm text-muted-foreground">
          This invoice is booked in period {purchaseInvoice.bookingPeriod}: its
          details can no longer be edited. It can still be held, released from
          a hold, or cancelled.
        </p>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={() => run(() => cancelPurchaseInvoice(purchaseInvoice.uuid))}
        isPending={isPending}
        title="Cancel purchase invoice"
        description="This cancels the invoice and removes the stock it received. It's blocked if any of that stock has already been reserved or sold. This cannot be undone."
        confirmLabel="Cancel Invoice"
      />
    </div>
  );
};
