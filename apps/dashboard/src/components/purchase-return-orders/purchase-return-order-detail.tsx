"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PackageX, Plus, ReceiptText, Trash2 } from "lucide-react";
import {
  creditPurchaseReturnOrder,
  deletePurchaseReturnLine,
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
import { DocumentCell } from "@/components/ui/document-cell";
import { FormError } from "@/components/ui/form-error";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import {
  cn,
  formatAddressLine,
  formatDateColumn,
  formatMoney,
  formatNumber,
  fullName,
  isPurchaseReturnOrderEditable,
  orDash,
  pluralize,
  userName,
  yesNo,
} from "@/lib/helpers";
import {
  COMPLAINT_STATUS_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_LINE_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  PURCHASE_RETURN_ORDER_REASON_LABELS,
  TRANSPORT_MODE_LABELS,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
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
  const [selectedLineUuid, setSelectedLineUuid] = useState<string | null>(
    null,
  );

  // A purchase return is delivered back, then invoiced by the credit note.
  const isDispatched = returnOrder.status === "delivered";
  const isCredited = returnOrder.status === "invoiced";
  const isCancelled = returnOrder.status === "cancelled";
  const isEditable = isPurchaseReturnOrderEditable(returnOrder.status);
  // What has actually gone: the planned quantities, once the goods have left.
  const hasLeft = isDispatched || isCredited;

  const creditedTotal = returnOrder.credits.reduce(
    (total, credit) => total + Number(credit.invoiceTotal ?? 0),
    0,
  );

  const deliveryAddress = formatAddressLine({
    streetAndNo: returnOrder.deliveryStreetAndNo,
    postalCode: returnOrder.deliveryPostalCode,
    city: returnOrder.deliveryCity,
  });

  const selectedLine =
    returnOrder.items.find((item) => item.uuid === selectedLineUuid) ?? null;

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  const deleteSelectedLine = () => {
    if (!selectedLine) {
      return;
    }
    const lineUuid = selectedLine.uuid;
    setSelectedLineUuid(null);
    run(() => deletePurchaseReturnLine(returnOrder.uuid, lineUuid));
  };

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      {/* The reference's return toolbar: `Make final · Print… · Send… · Show
          company · Show purchase order · Show complaint`. */}
      <div className="flex flex-wrap gap-2">
        <span title="Not built yet">
          <Button type="button" variant="outline" size="sm" disabled>
            Make final
          </Button>
        </span>
        <span title="Not built yet">
          <Button type="button" variant="outline" size="sm" disabled>
            Print…
          </Button>
        </span>
        <span title="Not built yet">
          <Button type="button" variant="outline" size="sm" disabled>
            Send…
          </Button>
        </span>
        <RelatedRecordsBar
          records={[
            {
              label: "Show company",
              href: `/companies/${returnOrder.supplierUuid}`,
            },
            {
              label: "Show purchase order",
              href: returnOrder.purchaseOrderUuid
                ? `/purchase-orders/${returnOrder.purchaseOrderUuid}`
                : null,
            },
            {
              label: "Show complaint",
              href: returnOrder.complaintUuid
                ? `/complaints/${returnOrder.complaintUuid}`
                : null,
            },
          ]}
        />
      </div>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Purchase return order
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Supplier" value={returnOrder.supplierName} />
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
            label="Contact"
            value={fullName(
              returnOrder.contactFirstName,
              returnOrder.contactLastName,
            )}
          />
          <DetailField
            label="Purchaser"
            value={userName(returnOrder.purchaser, userNames)}
          />
          <DetailField
            label="Purchase order type"
            value={
              returnOrder.purchaseOrderType
                ? PURCHASE_ORDER_TYPE_LABELS[returnOrder.purchaseOrderType]
                : null
            }
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
            label="Payment terms"
            value={
              returnOrder.paymentTerms
                ? INVOICE_PAYMENT_TERM_LABELS[returnOrder.paymentTerms]
                : null
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Delivery</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
          <DetailField label="Drop-off" value={yesNo(returnOrder.isDropOff)} />
          <DetailField label="Delivery address" value={deliveryAddress} />
          <DetailField label="Pick-up" value={returnOrder.pickupAddress} />
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
            label="Options"
            value={formatMoney(Number(returnOrder.optionsRevenue ?? 0))}
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
            label="VAT"
            value={formatMoney(Number(returnOrder.vatAmount ?? 0))}
          />
          <DetailField
            label="Total incl. VAT"
            value={formatMoney(Number(returnOrder.totalInclVat ?? 0))}
          />
          <DetailField
            label="Total weight"
            value={`${formatNumber(Number(returnOrder.totalWeightKg ?? 0))} kg`}
          />
        </div>
      </section>

      {isEditable && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
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

      <div className="space-y-2">
        {/* Nothing raises a work order for a purchase return yet, so the
            panel the reference shows here is empty. */}
        <CollapsibleSection title="Workorders" summary="No work orders">
          <p className="text-sm text-muted-foreground">
            No work orders on this purchase return order.
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Lines"
          summary={`${returnOrder.items.length} ${pluralize(returnOrder.items.length, "line")}`}
          defaultOpen
        >
          <div className="space-y-3">
            {/* `New` on the reference's return line grid opens a picker of the
                parcels received, not a blank row; `Delete` acts on the
                selected line. */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPickerOpen(true)}
                disabled={!isEditable}
              >
                <Plus className="size-4" />
                New
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deleteSelectedLine}
                disabled={!isEditable || !selectedLine || isPending}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
              <span title="Not built yet">
                <Button type="button" variant="outline" size="sm" disabled>
                  Sawing specifications
                </Button>
              </span>
            </div>
            <ReturnLinesPickerDialog
              purchaseReturnOrderUuid={returnOrder.uuid}
              open={isPickerOpen}
              onOpenChange={setIsPickerOpen}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Code</TableHead>
                  <TableHead>Order line</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty(p)</TableHead>
                  <TableHead className="text-right">Qty(a)</TableHead>
                  <TableHead>U</TableHead>
                  <TableHead className="text-right">Length</TableHead>
                  <TableHead>Delivery date</TableHead>
                  <TableHead className="text-right">Kg(p)</TableHead>
                  <TableHead className="text-right">Kg(a)</TableHead>
                  <TableHead className="text-right">Gross price</TableHead>
                  <TableHead>U</TableHead>
                  <TableHead className="text-right">Line discount</TableHead>
                  <TableHead>U</TableHead>
                  <TableHead className="text-right">Group discount</TableHead>
                  <TableHead>U</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnOrder.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={19}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No lines on this purchase return order.
                    </TableCell>
                  </TableRow>
                ) : (
                  returnOrder.items.map((item) => {
                    const length = item.lengthMm ?? item.lotLengthMm;
                    return (
                      <TableRow
                        key={item.uuid}
                        onClick={() =>
                          setSelectedLineUuid((current) =>
                            current === item.uuid ? null : item.uuid,
                          )
                        }
                        aria-selected={item.uuid === selectedLineUuid}
                        className={cn(
                          "cursor-pointer",
                          item.uuid === selectedLineUuid && "bg-muted",
                        )}
                      >
                        <TableCell className="text-right tabular-nums">
                          {orDash(item.lineNumber)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {item.originalPurchaseOrderLine === null
                            ? "—"
                            : [item.reference, item.originalPurchaseOrderLine]
                                .filter((part) => part !== null && part !== "")
                                .join("/")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.productUuid ? (
                            <Link
                              href={`/products/${item.productUuid}`}
                              className="text-primary hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {item.productCode ?? item.productUuid}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{orDash(item.productName)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(Number(item.returnQty ?? 0))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(
                            hasLeft ? Number(item.returnQty ?? 0) : 0,
                          )}
                        </TableCell>
                        <TableCell>{item.unit?.toUpperCase() ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {orDash(length)}
                        </TableCell>
                        <TableCell>{formatDateColumn(item.returnDate)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(Number(item.weightKg ?? 0))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(
                            hasLeft ? Number(item.weightKg ?? 0) : 0,
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(
                            Number(item.grossPrice ?? item.netPrice ?? 0),
                          )}
                        </TableCell>
                        <TableCell>{orDash(item.priceUnit)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(Number(item.lineDiscountPercent ?? 0))}
                        </TableCell>
                        <TableCell>%</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(Number(item.groupDiscountPercent ?? 0))}
                        </TableCell>
                        <TableCell>%</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(Number(item.amount ?? 0))}
                        </TableCell>
                        <TableCell>
                          {item.lineStatus
                            ? ORDER_LINE_STATUS_LABELS[item.lineStatus]
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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

        {/* The supplier's credit notes against this return. */}
        <CollapsibleSection
          title="Invoice lines"
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
          title="Complaints"
          summary={
            returnOrder.complaintUuid
              ? `Complaint ${returnOrder.complaintId ?? returnOrder.complaintRef ?? ""}`
              : "No complaint"
          }
        >
          {returnOrder.complaintUuid ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Report date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Link
                      href={`/complaints/${returnOrder.complaintUuid}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {returnOrder.complaintId ?? returnOrder.complaintRef}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {formatDateColumn(returnOrder.complaintReportDate)}
                  </TableCell>
                  <TableCell>
                    {returnOrder.complaintStatus
                      ? COMPLAINT_STATUS_LABELS[returnOrder.complaintStatus]
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-pre-wrap">
                    {orDash(returnOrder.complaintDescription)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No complaint is linked to this purchase return order.
            </p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Logistics">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <DetailField
              label="Complete delivery"
              value={yesNo(returnOrder.completeDelivery)}
            />
            <DetailField
              label="Vehicle with crane"
              value={yesNo(returnOrder.vehicleWithCrane)}
            />
            <DetailField
              label="Vehicle with canopy"
              value={yesNo(returnOrder.vehicleWithCanopy)}
            />
            <DetailField
              label="Bundling separate"
              value={yesNo(returnOrder.bundlingSeparate)}
            />
            <DetailField
              label="Unloading warehouse per line"
              value={yesNo(returnOrder.unloadingWarehousePerLine)}
            />
            <DetailField
              label="Transport"
              value={
                returnOrder.transportRegion
                  ? WAREHOUSE_TRANSPORT_REGION_LABELS[
                      returnOrder.transportRegion
                    ]
                  : null
              }
            />
            <DetailField
              label="Transport mode"
              value={
                returnOrder.transportMode
                  ? TRANSPORT_MODE_LABELS[returnOrder.transportMode]
                  : null
              }
            />
            <DetailField
              label="Pick up after"
              value={returnOrder.pickupAfterTime}
            />
            <DetailField
              label="Pick up for"
              value={returnOrder.pickupForTime}
            />
            <DetailField
              label="Max. length (mm)"
              value={returnOrder.maxLengthMm}
            />
            <DetailField
              label="Max. bundle weight (kg)"
              value={
                returnOrder.maxBundleWeightKg === null
                  ? null
                  : formatNumber(Number(returnOrder.maxBundleWeightKg))
              }
            />
          </div>
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

        <CollapsibleSection
          title="Documents"
          summary={`${returnOrder.documents?.length ?? 0} ${pluralize(returnOrder.documents?.length ?? 0, "Document")}`}
        >
          <DocumentCell documents={returnOrder.documents} />
        </CollapsibleSection>
      </div>
    </div>
  );
};
