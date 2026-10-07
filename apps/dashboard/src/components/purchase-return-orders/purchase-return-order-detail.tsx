"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PackageX, Plus, ReceiptText } from "lucide-react";
import {
  creditPurchaseReturnOrder,
  dispatchPurchaseReturnOrder,
  PurchaseReturnOrderDetail,
} from "@/app/(dashboard)/purchase-return-orders/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ReturnLinesPickerDialog } from "@/components/purchase-return-orders/return-lines-picker-dialog";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DetailField } from "@/components/ui/detail-field";
import { FormError } from "@/components/ui/form-error";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  fullName,
  isPurchaseReturnOrderEditable,
  orDash,
  pluralize,
  userName,
} from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_RETURN_ORDER_REASON_LABELS,
} from "@/lib/labels";

type Props = {
  /** Clerk id -> name; these columns store the id, not the name. */
  userNames: Record<string, string>;
  returnOrder: PurchaseReturnOrderDetail;
};

export const PurchaseReturnOrderDetailView = ({
  returnOrder,
  userNames,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // A purchase return is delivered back, then invoiced by the credit note.
  const isDispatched = returnOrder.status === "delivered";
  const isCredited = returnOrder.status === "invoiced";
  const isCancelled = returnOrder.status === "cancelled";

  const returnedValue = returnOrder.items.reduce(
    (total, item) => total + Number(item.amount ?? 0),
    0,
  );
  const creditedTotal = returnOrder.credits.reduce(
    (total, credit) => total + Number(credit.invoiceTotal ?? 0),
    0,
  );

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Purchase return order
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Supplier" value={returnOrder.supplierName} />
          <DetailField
            label="Contact"
            value={fullName(
              returnOrder.contactFirstName,
              returnOrder.contactLastName,
            )}
          />
          <DetailField
            label="Status"
            value={
              returnOrder.status
                ? PURCHASE_ORDER_STATUS_LABELS[returnOrder.status]
                : null
            }
          />
          <DetailField
            label="Purchase order"
            value={returnOrder.originalPurchaseOrderId}
          />
          <DetailField
            label="Complaint"
            value={
              returnOrder.complaintUuid ? (
                <Link
                  href={`/complaints/${returnOrder.complaintUuid}`}
                  className="underline-offset-2 hover:underline"
                >
                  {returnOrder.complaintRef ?? "Show complaint"}
                </Link>
              ) : (
                returnOrder.complaintRef
              )
            }
          />
          <DetailField
            label="Return date"
            value={formatDateColumn(returnOrder.returnDate)}
          />
          <DetailField
            label="Return reason"
            value={
              returnOrder.returnReason
                ? PURCHASE_RETURN_ORDER_REASON_LABELS[returnOrder.returnReason]
                : null
            }
          />
          <DetailField
            label="Payment terms"
            value={
              returnOrder.paymentTerms
                ? INVOICE_PAYMENT_TERM_LABELS[returnOrder.paymentTerms]
                : null
            }
          />
          <DetailField
            label="Purchaser"
            value={userName(returnOrder.purchaser, userNames)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="Materials"
            value={formatMoney(Number(returnOrder.materialsRevenue ?? 0))}
          />
          <DetailField
            label="Surcharges"
            value={formatMoney(Number(returnOrder.surchargesRevenue ?? 0))}
          />
          <DetailField
            label="Total excl. VAT"
            value={formatMoney(Number(returnOrder.totalExclVat ?? 0))}
          />
          <DetailField
            label="Total weight"
            value={`${formatNumber(Number(returnOrder.totalWeightKg ?? 0))} kg`}
          />
        </div>
      </section>

      {isPurchaseReturnOrderEditable(returnOrder.status) && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link href={`/purchase-return-orders/${returnOrder.uuid}/edit`} />
            }
          >
            Edit Return Order
          </Button>
        </div>
      )}

      {!isCancelled && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
          {/* Goods leaving and the supplier's credit arriving are two
              decisions, so they are two buttons. */}
          <Button
            type="button"
            onClick={() =>
              run(() => dispatchPurchaseReturnOrder(returnOrder.uuid))
            }
            disabled={isPending || isDispatched || isCredited}
          >
            <PackageX className="size-4" />
            {isDispatched || isCredited ? "Goods sent back" : "Send goods back"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              run(() => creditPurchaseReturnOrder(returnOrder.uuid))
            }
            disabled={isPending || !isDispatched}
          >
            <ReceiptText className="size-4" />
            {isCredited ? "Credited" : "Book supplier credit note"}
          </Button>

          <p className="text-sm text-muted-foreground">
            {isCredited
              ? `Credited by the supplier: ${formatMoney(Math.abs(creditedTotal))}.`
              : isDispatched
                ? "Stock has left. Booking the credit note reduces what we owe this supplier."
                : "Sending the goods back takes them out of the lot they arrived in, at the price they were bought for."}
          </p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b pb-2">
          <h2 className="text-base font-semibold">Return lines</h2>
          <span className="text-xs text-muted-foreground">
            {pluralize(returnOrder.items.length, "line")} ·{" "}
            {formatMoney(returnedValue)}
          </span>
        </div>
        {/* `New` on the reference's return line grid opens a picker of the
            parcels received, not a blank row. */}
        {isPurchaseReturnOrderEditable(returnOrder.status) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPickerOpen(true)}
          >
            <Plus className="size-4" />
            New
          </Button>
        )}
        <ReturnLinesPickerDialog
          purchaseReturnOrderUuid={returnOrder.uuid}
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
        />
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Line</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Return reason</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Return qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Net price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnOrder.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No lines on this purchase return order.
                  </TableCell>
                </TableRow>
              ) : (
                returnOrder.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="text-right tabular-nums">
                      {orDash(item.lineNumber)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.productUuid ? (
                        <Link
                          href={`/products/${item.productUuid}`}
                          className="text-primary hover:underline"
                        >
                          {[item.productCode, item.productName]
                            .filter(Boolean)
                            .join(" — ") || item.productUuid}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{orDash(item.reference)}</TableCell>
                    <TableCell>
                      {item.returnReason
                        ? PURCHASE_RETURN_ORDER_REASON_LABELS[item.returnReason]
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.quantity ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.returnQty ?? 0))}
                    </TableCell>
                    <TableCell>{item.unit?.toUpperCase() ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.netPrice ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.amount ?? 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="space-y-2">
        <CollapsibleSection
          title="Credits"
          summary={
            returnOrder.credits.length === 0
              ? "Not credited"
              : `${formatMoney(Math.abs(creditedTotal))} credited`
          }
        >
          {returnOrder.credits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              The supplier has not credited this return yet.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credit note</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Materials</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnOrder.credits.map((credit) => (
                    <TableRow key={credit.uuid}>
                      <TableCell>
                        <Link
                          href={`/purchase-invoices/${credit.uuid}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {credit.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatDateColumn(credit.invoiceDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(credit.materials ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(credit.invoiceTotal ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(credit.outstanding))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Surcharges"
          summary={pluralize(returnOrder.surcharges.length, "surcharge")}
        >
          {returnOrder.surcharges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No surcharges on this purchase return order.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnOrder.surcharges.map((surcharge) => (
                    <TableRow key={surcharge.uuid}>
                      <TableCell>{orDash(surcharge.description)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(surcharge.amount ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Texts"
          summary={pluralize(returnOrder.texts.length, "text")}
        >
          {returnOrder.texts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No texts on this purchase return order.
            </p>
          ) : (
            <ul className="space-y-3">
              {returnOrder.texts.map((text) => (
                <li key={text.uuid} className="text-sm">
                  <p className="font-medium">{orDash(text.title)}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {orDash(text.textBlock)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
};
