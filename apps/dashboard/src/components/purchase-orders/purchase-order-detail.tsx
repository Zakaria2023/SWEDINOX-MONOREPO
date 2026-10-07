"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Undo2, Warehouse } from "lucide-react";
import {
  cancelPurchaseOrder,
  createUnloadingWorkOrder,
  PurchaseOrderDetail,
} from "@/app/(dashboard)/purchase-orders/actions";
import { startPurchaseReturnFromOrder } from "@/app/(dashboard)/purchase-return-orders/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PurchaseLineToolbar } from "@/components/purchase-orders/purchase-line-toolbar";
import { ReceptionToolbar } from "@/components/purchase-orders/reception-toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import {
  cn,
  formatDateColumn,
  formatLengthMm,
  formatMoney,
  formatNumber,
  orDash,
  pluralize,
  runningMeters,
} from "@/lib/helpers";
import {
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_RETURN_ORDER_REASON_LABELS,
  RECEIPT_STATUS_LABELS,
  STOCK_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  purchaseOrder: PurchaseOrderDetail;
};

export const PurchaseOrderDetailView = ({ purchaseOrder }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [raised, setRaised] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // The reference's reception toolbar acts on a selected row rather than
  // hanging a column of buttons off every one of them.
  const [selectedReceiptUuid, setSelectedReceiptUuid] = useState<string | null>(
    null,
  );
  const [selectedLineUuid, setSelectedLineUuid] = useState<string | null>(null);

  const canCancel = purchaseOrder.status !== "cancelled";
  // `Par. return` wakes as soon as anything on the order has arrived — it was
  // live on `404102` with lines still `Received` and greyed on an order whose
  // every line was invoiced and gone (7-10-2026). The server re-checks that
  // something received is still on the shelf.
  const canPartReturn =
    canCancel &&
    purchaseOrder.items.some((item) => Number(item.qtyReceived ?? 0) > 0);

  const handlePartReturn = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await startPurchaseReturnFromOrder(purchaseOrder.uuid);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  // `Workorder` on the reference's own toolbar. Reporting the unloading it
  // raises is what creates the stock lot — not the invoice.
  const handleRaiseUnloading = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await createUnloadingWorkOrder(purchaseOrder.uuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRaised(true);
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelPurchaseOrder(purchaseOrder.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      {/* 🔴 The toolbar sits above the document, as it does on every reference
          screen: `Print… · Send… · Return · Confirm · Pre-notifiy · Show
          company · Copy · **Workorder** · Options…`. Ours carries the ones that
          do something. */}
      {canCancel && (
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <Button
            type="button"
            onClick={handleRaiseUnloading}
            disabled={isPending}
          >
            <Warehouse className="me-1.5 size-4" />
            {isPending ? "Raising…" : "Workorder"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePartReturn}
            disabled={isPending || !canPartReturn}
          >
            <Undo2 className="me-1.5 size-4" />
            Par. return
          </Button>
          <Button
            variant="outline"
            render={
              <Link href={`/purchase-orders/${purchaseOrder.uuid}/edit`} />
            }
          >
            Edit details
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending}
          >
            Cancel purchase order
          </Button>
        </div>
      )}

      {raised && (
        <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          Unloading work order raised. Release it, then report what actually
          turns up — bundle by bundle, each with its heat number — and that is
          what puts the metal on a shelf.{" "}
          <Link
            href="/warehouse-work-orders"
            className="text-primary hover:underline"
          >
            Open warehouse work orders
          </Link>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Supplier
          </p>
          <p className="text-sm">{purchaseOrder.supplierName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Agent
          </p>
          <p className="text-sm">{purchaseOrder.agentName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Contact
          </p>
          <p className="text-sm">
            {[purchaseOrder.contactFirstName, purchaseOrder.contactLastName]
              .filter(Boolean)
              .join(" ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm">
            {PURCHASE_ORDER_STATUS_LABELS[purchaseOrder.status]}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order Date
          </p>
          <p className="text-sm">{purchaseOrder.orderDate ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Reference
          </p>
          <p className="text-sm">{purchaseOrder.reference ?? "—"}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Lines</h2>
        {canCancel && (
          <PurchaseLineToolbar
            selected={
              purchaseOrder.items.find(
                (item) => item.uuid === selectedLineUuid,
              ) ?? null
            }
          />
        )}
        <div>
          <Table>
            <TableHeader>
              {/* 🔴 The reference's own line grid, column for column:
                  `Code` · `Delivery date` · `Status` · `Product` · `Quality` ·
                  `Length` · `Width` · `Thickness` · `Qty(p)` · `U` · `Kg(p)` ·
                  `M1(p)` · `Net Price` · `U`. */}
              <TableRow>
                <TableHead className="text-right">Code</TableHead>
                {/* `Type` on the reference's grid: `Stk` · `CD` · `EXW`. */}
                <TableHead>Type</TableHead>
                <TableHead>Delivery date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Width</TableHead>
                <TableHead className="text-right">Thickness</TableHead>
                <TableHead className="text-right">Qty (p)</TableHead>
                <TableHead className="text-right">Qty (a)</TableHead>
                <TableHead>U</TableHead>
                <TableHead className="text-right">Kg (p)</TableHead>
                <TableHead className="text-right">M1 (p)</TableHead>
                <TableHead className="text-right">Net price</TableHead>
                <TableHead>U</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Stock status</TableHead>
                <TableHead className="text-right">Lot valuation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={20}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No lines on this order.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrder.items.map((item) => (
                  <TableRow
                    key={item.uuid}
                    onClick={() => setSelectedLineUuid(item.uuid)}
                    className={cn(
                      "cursor-pointer",
                      item.uuid === selectedLineUuid && "bg-accent",
                    )}
                  >
                    <TableCell className="text-right tabular-nums">
                      {item.lineNumber === null ? "—" : item.lineNumber * 10}
                    </TableCell>
                    <TableCell>{ORDER_SOURCE_TYPE_LABELS[item.sourceType]}</TableCell>
                    <TableCell>{formatDateColumn(item.receiptDate)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={item.lineStatus}
                        label={
                          item.lineStatus
                            ? ORDER_LINE_STATUS_LABELS[item.lineStatus]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ")}
                    </TableCell>
                    <TableCell>{orDash(item.qualityCode)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatLengthMm(item.lengthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(item.widthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(item.thicknessMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.orderedQuantity}
                    </TableCell>
                    {/* What arrived. A line closed short reads its closing
                        figure here and `Received` beside it. */}
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.qtyReceived ?? 0))}
                      {item.closedAt && (
                        <span className="ms-1 text-xs text-muted-foreground">
                          (closed)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{orDash(item.unit ? item.unit.toUpperCase() : null)}</TableCell>
                    {/* 🔑 The weighed weight where a lorry has been, the
                        theoretical one until then — the same figure the line is
                        billed on, so the grid cannot disagree with its own
                        amount. */}
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(
                        Number(item.kgActual ?? item.kgPurchased ?? 0),
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(
                        runningMeters({
                          quantity: Number(item.orderedQuantity ?? 0),
                          unit: item.unit,
                          lengthMm: item.lengthMm,
                        }),
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.netPrice ?? 0))}
                    </TableCell>
                    <TableCell>{orDash(item.priceUnit)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.amount ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.stockQuantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={item.stockStatus}
                        label={
                          item.stockStatus
                            ? STOCK_STATUS_LABELS[item.stockStatus]
                            : null
                        }
                      />
                    </TableCell>
                    {/* A lot received before purchase lines carried a price
                        shows zero here — the sales margin drawn from it is
                        measured against the replacement price instead. */}
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        item.stockUuid &&
                          Number(item.stockValuationPrice ?? 0) === 0 &&
                          "text-destructive",
                      )}
                    >
                      {item.stockUuid
                        ? formatMoney(Number(item.stockValuationPrice ?? 0))
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2">
        {/* What has actually arrived. Booked against the order since receivals
            existed and never shown on it. */}
        <CollapsibleSection
          title="Receipts"
          summary={pluralize(purchaseOrder.receipts.length, "reception")}
        >
          {purchaseOrder.receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No receptions on this order.
            </p>
          ) : (
            <div className="space-y-3">
              <ReceptionToolbar
                orderId={purchaseOrder.id}
                selected={
                  purchaseOrder.receipts.find(
                    (receipt) => receipt.uuid === selectedReceiptUuid,
                  ) ?? null
                }
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Line</TableHead>
                    <TableHead>Receipt date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Line status</TableHead>
                    <TableHead>Receipt status</TableHead>
                    <TableHead className="text-right">Qty (p)</TableHead>
                    <TableHead className="text-right">Qty (a)</TableHead>
                    <TableHead>U</TableHead>
                    <TableHead className="text-right">Kg (p)</TableHead>
                    <TableHead className="text-right">Kg (a)</TableHead>
                    <TableHead className="text-right">Confirmed</TableHead>
                    {/* The lot identity the reception carries. Held since the
                        receipt chain was built and never shown, so a reception
                        that knew its heat number looked like one that did not. */}
                    <TableHead>Charge</TableHead>
                    <TableHead>Internal charge</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Purchaser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.receipts.map((receipt) => (
                    <TableRow
                      key={receipt.uuid}
                      onClick={() => setSelectedReceiptUuid(receipt.uuid)}
                      className={cn(
                        "cursor-pointer",
                        receipt.uuid === selectedReceiptUuid && "bg-accent",
                      )}
                    >
                      <TableCell className="text-right tabular-nums">
                        {orDash(receipt.lineNumber)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateColumn(receipt.receiptDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {[receipt.productCode, receipt.productName]
                          .filter(Boolean)
                          .join(" — ") || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={receipt.lineStatus}
                          label={
                            receipt.lineStatus
                              ? ORDER_LINE_STATUS_LABELS[receipt.lineStatus]
                              : null
                          }
                        />
                      </TableCell>
                      {/* A badge with its proper label, as every other status
                          on this screen carries — the raw enum value was
                          printing through as `received`. */}
                      <TableCell>
                        <StatusBadge
                          value={receipt.receiptStatus}
                          label={
                            receipt.receiptStatus
                              ? RECEIPT_STATUS_LABELS[receipt.receiptStatus]
                              : null
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.qtyPlanned ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.qtyActual ?? 0))}
                      </TableCell>
                      <TableCell>
                        {orDash(
                          receipt.unit ? receipt.unit.toUpperCase() : null,
                        )}
                      </TableCell>
                      {/* What this reception expects, carried off the line it
                          belongs to. Nothing has arrived until a lorry does, so
                          `Kg(a)` beside it is 0 by design rather than by
                          omission. */}
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.kgPlanned ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.kgActual ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.receivedQty ?? 0))}
                      </TableCell>
                      <TableCell>{orDash(receipt.charge)}</TableCell>
                      <TableCell>{orDash(receipt.internalCharge)}</TableCell>
                      {/* Set by `Batch registration` and by nothing else.
                          Worth a column because a waived reception quietly
                          disappears from the screens that chase paperwork. */}
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {receipt.documentObligationWaived
                          ? "Obligation waived"
                          : "Required"}
                      </TableCell>
                      <TableCell>{orDash(receipt.purchaser)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        {/* The link has been in the schema since contracts existed; no screen
            followed it, so an order bought under an agreement never said so. */}
        <CollapsibleSection
          title="Contracts"
          summary={pluralize(purchaseOrder.contracts.length, "contract")}
        >
          {purchaseOrder.contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This order is not attached to a contract.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">
                      Max weight (kg)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.contracts.map((contract) => (
                    <TableRow key={contract.uuid}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/contracts/${contract.uuid}`}
                          className="text-primary hover:underline"
                        >
                          {contract.code}
                        </Link>
                      </TableCell>
                      <TableCell>{contract.description}</TableCell>
                      <TableCell>
                        {contract.contractType
                          ? CONTRACT_TYPE_LABELS[contract.contractType]
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {contract.role
                          ? CONTRACTABLE_ROLE_LABELS[contract.role]
                          : "—"}
                      </TableCell>
                      <TableCell>{orDash(contract.startingDate)}</TableCell>
                      <TableCell>{orDash(contract.endDate)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(contract.maxWeightKg ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Return lines"
          summary={pluralize(purchaseOrder.returnLines.length, "return line")}
        >
          {purchaseOrder.returnLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing from this order is going back to the supplier.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return order</TableHead>
                    <TableHead className="text-right">Line</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Return date</TableHead>
                    <TableHead className="text-right">Return qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.returnLines.map((line) => (
                    <TableRow key={line.uuid}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/purchase-return-orders/${line.returnOrderUuid}`}
                          className="text-primary hover:underline"
                        >
                          #{orDash(line.returnOrderId)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(line.lineNumber)}
                      </TableCell>
                      <TableCell>
                        {[line.productCode, line.productName]
                          .filter(Boolean)
                          .join(" — ") || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={line.returnOrderStatus}
                          label={
                            line.returnOrderStatus
                              ? PURCHASE_ORDER_STATUS_LABELS[
                                  line.returnOrderStatus
                                ]
                              : null
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {line.returnReason
                          ? PURCHASE_RETURN_ORDER_REASON_LABELS[
                              line.returnReason
                            ]
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateColumn(line.returnDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(line.returnQty ?? 0))}
                      </TableCell>
                      <TableCell>{line.unit?.toUpperCase() ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(line.amount ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        {/* Where each document type actually goes for this supplier. Routing is
            held per company, and this is the screen where somebody asks whether
            the order reached them and at which address. */}
        <CollapsibleSection
          title="Communication"
          summary={pluralize(purchaseOrder.communication.length, "route")}
        >
          {purchaseOrder.communication.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No document routing is configured for this supplier, so documents
              go to their contacts.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Shape</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.communication.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">
                        {route.documentType
                          ? COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[
                              route.documentType
                            ]
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {route.communicationType
                          ? COMMUNICATION_SETTING_TYPE_LABELS[
                              route.communicationType
                            ]
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {route.shape
                          ? COMMUNICATION_SETTING_SHAPE_LABELS[route.shape]
                          : "—"}
                      </TableCell>
                      <TableCell>{orDash(route.email)}</TableCell>
                      <TableCell>{orDash(route.fax)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleCancel}
        isPending={isPending}
        title="Cancel purchase order"
        description="This cancels the order and removes its pending stock. This cannot be undone."
        confirmLabel="Cancel Order"
      />
    </div>
  );
};
