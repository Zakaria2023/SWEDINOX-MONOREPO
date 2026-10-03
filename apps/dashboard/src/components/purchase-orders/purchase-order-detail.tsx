"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  cancelPurchaseOrder,
  PurchaseOrderDetail,
} from "@/app/(dashboard)/purchase-orders/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
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
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
  STOCK_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  purchaseOrder: PurchaseOrderDetail;
};

export const PurchaseOrderDetailView = ({ purchaseOrder }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const canCancel = purchaseOrder.status !== "cancelled";

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
        <h2 className="border-b pb-2 text-base font-semibold">Products</h2>
        <div>
          <Table>
            <TableHeader>
              {/* 🔴 The reference's own line grid, column for column:
                  `Code` · `Delivery date` · `Status` · `Product` · `Quality` ·
                  `Length` · `Width` · `Thickness` · `Qty(p)` · `U` · `Kg(p)` ·
                  `M1(p)` · `Net Price` · `U`. */}
              <TableRow>
                <TableHead className="text-right">Code</TableHead>
                <TableHead>Delivery date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Width</TableHead>
                <TableHead className="text-right">Thickness</TableHead>
                <TableHead className="text-right">Qty (p)</TableHead>
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
                    colSpan={18}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No lines on this order.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrder.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="text-right tabular-nums">
                      {item.lineNumber === null ? "—" : item.lineNumber * 10}
                    </TableCell>
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
          title="Product Receipt Documents"
          summary={pluralize(purchaseOrder.receipts.length, "receipt")}
        >
          {purchaseOrder.receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing has been booked in against this order yet.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Line</TableHead>
                    <TableHead>Receipt date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Line status</TableHead>
                    <TableHead>Receipt status</TableHead>
                    <TableHead className="text-right">Planned</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Kg</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Purchaser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.receipts.map((receipt) => (
                    <TableRow key={receipt.uuid}>
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
                      <TableCell>{orDash(receipt.receiptStatus)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.qtyPlanned ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.receivedQty ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(receipt.kgActual ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(receipt.lineAmount ?? 0))}
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
                              ? RETURN_ORDER_STATUS_LABELS[
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

      {canCancel && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link href={`/purchase-orders/${purchaseOrder.uuid}/edit`} />
            }
          >
            Edit Details
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending}
          >
            Cancel Purchase Order
          </Button>
        </div>
      )}

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
