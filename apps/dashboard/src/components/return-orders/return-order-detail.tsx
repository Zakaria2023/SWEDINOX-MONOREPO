"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useState, useTransition } from "react";
import {
  deleteReturnOrder,
  ReturnOrderDetail,
} from "@/app/(dashboard)/return-orders/actions";
import { ReturnSettlementSection } from "@/components/return-orders/sections/return-settlement-section";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailField } from "@/components/ui/detail-field";
import { FormError } from "@/components/ui/form-error";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  fullName,
  orDash,
  pluralize,
  yesNo,
} from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_SURCHARGE_DESCRIPTION_LABELS,
  RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  returnOrder: ReturnOrderDetail;
};

export const ReturnOrderDetailView = ({ returnOrder }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteReturnOrder(returnOrder.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  const returnedValue = returnOrder.items.reduce(
    (total, item) => total + Number(item.amount ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Return order</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Customer" value={returnOrder.companyName} />
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
                ? RETURN_ORDER_STATUS_LABELS[returnOrder.status]
                : null
            }
          />
          <DetailField
            label="Order date"
            value={formatDateColumn(returnOrder.orderDate)}
          />

          {/* The original order. Previously stored and never shown — a return
              cannot be checked without opening what it came back from. */}
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Original order
            </p>
            {returnOrder.orderUuid ? (
              <Link
                href={`/orders/${returnOrder.orderUuid}`}
                className="text-sm text-primary hover:underline"
              >
                #{returnOrder.originalOrderId}
              </Link>
            ) : (
              <p className="text-sm">
                {returnOrder.orderReference ?? "—"}
              </p>
            )}
          </div>

          <DetailField
            label="Complaint reference"
            value={returnOrder.complaintRef}
          />
          <DetailField label="Customer ref." value={returnOrder.customerRef} />
          <DetailField label="Our reference" value={returnOrder.ourReference} />
          <DetailField
            label="Return reason"
            value={
              returnOrder.returnReason
                ? RETURN_ORDER_REASON_LABELS[returnOrder.returnReason]
                : null
            }
          />
          <DetailField
            label="Return date"
            value={formatDateColumn(returnOrder.returnDate)}
          />
          <DetailField label="Pick-up" value={yesNo(returnOrder.isPickup)} />
          <DetailField
            label="Pick-up address"
            value={returnOrder.pickupAddress}
          />
          <DetailField
            label="Handling blocked"
            value={yesNo(returnOrder.handlingBlocked)}
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
            label="Invoice blockage"
            value={yesNo(returnOrder.invoiceBlockage)}
          />
          <DetailField
            label="Blocking reason"
            value={returnOrder.blockingReason}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b pb-2">
          <h2 className="text-base font-semibold">Return lines</h2>
          <span className="text-xs text-muted-foreground">
            {pluralize(returnOrder.items.length, "line")} ·{" "}
            {formatMoney(returnedValue)}
          </span>
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Line</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Return reason</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Return qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Kg</TableHead>
                <TableHead className="text-right">Net price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {/* What the goods were sold for, against what is coming back. */}
                <TableHead className="text-right">Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnOrder.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No lines on this return order.
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
                        ? RETURN_ORDER_REASON_LABELS[item.returnReason]
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
                      {orDash(item.lengthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(item.weightKg ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.netPrice ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(item.amount ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.salesAmount === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        formatMoney(Number(item.salesAmount))
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="space-y-2">
        <ReturnSettlementSection returnOrder={returnOrder} />

        <CollapsibleSection
          title="Surcharges"
          summary={pluralize(returnOrder.surcharges.length, "surcharge")}
        >
          {returnOrder.surcharges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No surcharges on this return order.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Surcharge</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnOrder.surcharges.map((surcharge) => (
                    <TableRow key={surcharge.uuid}>
                      <TableCell className="font-medium">
                        {surcharge.description
                          ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[
                              surcharge.description
                            ]
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(surcharge.surcharge ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(surcharge.amount ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(surcharge.profit ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        {/* Production that touched these goods. Reached through the order line
            the return points at — the only link a workorder carries back. */}
        <CollapsibleSection
          title="Workorders"
          summary={pluralize(returnOrder.workOrders.length, "workorder line")}
        >
          {returnOrder.workOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No production workorder touched the goods on this return.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workorder</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty planned</TableHead>
                    <TableHead className="text-right">Qty actual</TableHead>
                    <TableHead className="text-right">Kg actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnOrder.workOrders.map((line) => (
                    <TableRow key={line.uuid}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/production-workorders/${line.workOrderUuid}`}
                          className="text-primary hover:underline"
                        >
                          #{orDash(line.workOrderId)}
                        </Link>
                      </TableCell>
                      <TableCell>{orDash(line.machineName)}</TableCell>
                      <TableCell>{formatDateColumn(line.date)}</TableCell>
                      <TableCell>
                        {line.status
                          ? WAREHOUSE_WORK_ORDER_STATUS_LABELS[line.status]
                          : "—"}
                      </TableCell>
                      <TableCell>{orDash(line.productCode)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(line.qtyPlanned ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(line.qtyActual ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(line.kgActual ?? 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleSection>

        {/* A return and a complaint are two records of the same event — the
            customer sending something back and saying why. */}
        <CollapsibleSection
          title="Complaints"
          summary={pluralize(returnOrder.complaints.length, "complaint line")}
        >
          {returnOrder.complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No complaint has been raised about the goods on this return.
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Solution</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnOrder.complaints.map((line) => (
                    <TableRow key={line.uuid}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/complaints/${line.complaintUuid}`}
                          className="text-primary hover:underline"
                        >
                          #{orDash(line.complaintId)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatDateColumn(line.reportDate)}
                      </TableCell>
                      <TableCell>
                        {line.status
                          ? COMPLAINT_STATUS_LABELS[line.status]
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {line.category
                          ? COMPLAINT_CATEGORY_LABELS[line.category]
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {line.solution
                          ? COMPLAINT_SOLUTION_LABELS[line.solution]
                          : "—"}
                      </TableCell>
                      <TableCell>{orDash(line.description)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(line.qty ?? 0))}
                      </TableCell>
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

        {/* Stored on the return since it could be created, and never shown. */}
        <CollapsibleSection
          title="Documents"
          summary={pluralize(returnOrder.documents?.length ?? 0, "document")}
        >
          {!returnOrder.documents || returnOrder.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents attached to this return order.
            </p>
          ) : (
            <ul className="space-y-2">
              {returnOrder.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <FileText size={16} className="shrink-0 text-muted-foreground" />
                  <Link
                    href={`/api/documents/${document.id}/download`}
                    className="flex-1 text-primary hover:underline"
                  >
                    {document.fileName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Texts"
          summary={pluralize(returnOrder.texts.length, "text")}
        >
          {returnOrder.texts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No texts on this return order.
            </p>
          ) : (
            <div className="space-y-3">
              {returnOrder.texts.map((text) => (
                <div
                  key={text.uuid}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-sm font-medium">{text.title}</p>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {text.textBlock}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          render={<Link href={`/return-orders/${returnOrder.uuid}/edit`} />}
        >
          Edit Return Order
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isPending}
        >
          Delete Return Order
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete return order"
        description="This removes the return order, its lines, surcharges and texts. This cannot be undone."
        confirmLabel="Delete Return Order"
      />
    </div>
  );
};
