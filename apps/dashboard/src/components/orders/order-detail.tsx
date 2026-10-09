"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Copy,
  FileText,
  Mail,
  Pencil,
  Printer,
  Undo2,
  XCircle,
} from "lucide-react";
import {
  OrderCallOffAddressOption,
  OrderCallOffRow,
  OrderHeaderInfo,
  OrderInvoiceLineRow,
  OrderLinePanels,
  OrderTextRow,
  OrderWorkOrders,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import {
  cancelOrder,
  makeOrderFinal,
  sendOrderConfirmation,
  OrderDetail,
} from "@/app/(dashboard)/orders/actions";
import {
  OrderCommunicationRow,
  OrderCompetitorRow,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import { OrderHeader } from "@/components/orders/order-header";
import { OrderLinePanelsView } from "@/components/orders/panels/order-line-panels";
import {
  OrderFinancesPanel,
  OrderInvoiceLinesPanel,
} from "@/components/orders/panels/order-invoice-lines-panel";
import {
  OrderCommunicationPanel,
  OrderCompetitorsPanel,
} from "@/components/orders/panels/order-communication-panel";
import { OrderCallOffsPanel } from "@/components/orders/panels/order-call-offs-panel";
import { OrderWorkOrdersPanel } from "@/components/orders/panels/order-work-orders-panel";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  orDash,
  pluralize,
  runningMeters,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

const NOT_BUILT = "Not built yet";
const LINE_NOT_BUILT = "Not built: lines are changed through Edit Details";

type Props = {
  order: OrderDetail;
  header: OrderHeaderInfo | null;
  /** Clerk user id → name, for the header's `Seller`. */
  userNames: Record<string, string>;
  workOrders: OrderWorkOrders;
  communications: OrderCommunicationRow[];
  competitors: OrderCompetitorRow[];
  invoiceLines: OrderInvoiceLineRow[];
  texts: OrderTextRow[];
  /** Null only when the order has no lines at all to select from. */
  linePanels: OrderLinePanels | null;
  /** Only on a `Call-off` order. */
  callOffs: {
    rows: OrderCallOffRow[];
    addresses: OrderCallOffAddressOption[];
    userNames: Record<string, string>;
  } | null;
};

export const OrderDetailView = ({
  order,
  header,
  userNames,
  workOrders,
  invoiceLines,
  texts,
  linePanels,
  communications,
  competitors,
  callOffs,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isCancelled = order.status === "cancelled";
  // Making an order final is the one press that raises the picking and the
  // transport job, so it is only offered while the order is still a typed
  // document nobody has released.
  const canMakeFinal = order.status === "provisional";
  // A line is still open to billing until its invoiced quantity reaches its
  // quantity, which is when it becomes `invoiced`. With none left the
  // reference greys Cancel, Par. return and Invoice (106623, 7-10-2026).
  const isFullyInvoiced =
    order.status === "invoiced" ||
    (order.items.length > 0 &&
      order.items.every(
        (item) => item.status !== "reserved" && item.status !== "delivered",
      ));
  const canCancel = !isCancelled && !isFullyInvoiced;
  const canFollowUp = !isCancelled && !canMakeFinal && !isFullyInvoiced;

  const selectedLine = order.items.find(
    (item) => item.uuid === linePanels?.orderItemUuid,
  );
  const selectedLineLabel = [
    selectedLine?.lineNumber ?? "",
    selectedLine?.productCode ?? "",
  ]
    .filter(Boolean)
    .join(" · ");

  // Sending is a separate decision from releasing, which is how the reference
  // puts it: its dialog defaults to `Don't send`, so the plain button does not
  // and the second one says out loud that it will.
  const handleMakeFinal = (send: boolean) => {
    startTransition(async () => {
      const result = await makeOrderFinal(order.uuid, send);
      setError(result.error);
    });
  };

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendOrderConfirmation(order.uuid);
      setError(result.error);
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrder(order.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      {/* The reference's order toolbar, in its order: `Print… · Send… ·
          Return · Par. return · Show company · PAC · Cancel · Optimize · Copy
          · Workorder · Invoice`. What is not built here is drawn greyed. */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {!isCancelled && (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/orders/${order.uuid}/edit`} />}
          >
            <Pencil className="me-1.5 size-4" />
            Edit Details
          </Button>
        )}
        {canMakeFinal && (
          <>
            <Button
              type="button"
              onClick={() => handleMakeFinal(false)}
              disabled={isPending}
            >
              <BadgeCheck className="me-1.5 size-4" />
              {isPending ? "Making final..." : "Make Final"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMakeFinal(true)}
              disabled={isPending}
            >
              Make Final &amp; Send
            </Button>
          </>
        )}
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          <Printer className="me-1.5 size-4" />
          Print…
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSend}
          disabled={isPending || canMakeFinal || isCancelled}
        >
          <Mail className="me-1.5 size-4" />
          Send…
        </Button>
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          <Undo2 className="me-1.5 size-4" />
          Return
        </Button>
        {canFollowUp ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={`/return-orders/new?company=${order.companyUuid}&order=${order.uuid}`}
              />
            }
          >
            <Undo2 className="me-1.5 size-4" />
            Par. return
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <Undo2 className="me-1.5 size-4" />
            Par. return
          </Button>
        )}
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/companies/${order.companyUuid}`} />}
        >
          <Building2 className="me-1.5 size-4" />
          Show company
        </Button>
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          PAC
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isPending || !canCancel}
        >
          <XCircle className="me-1.5 size-4" />
          Cancel
        </Button>
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          Optimize
        </Button>
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          <Copy className="me-1.5 size-4" />
          Copy
        </Button>
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          Workorder
        </Button>
        {canFollowUp ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/invoices/add?company=${order.companyUuid}`} />
            }
          >
            <FileText className="me-1.5 size-4" />
            Invoice
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <FileText className="me-1.5 size-4" />
            Invoice
          </Button>
        )}
      </div>

      <OrderHeader
        order={order}
        header={header}
        sellerName={order.seller ? (userNames[order.seller] ?? null) : null}
      />

      {callOffs && (
        <OrderCallOffsPanel
          orderUuid={order.uuid}
          rows={callOffs.rows}
          addresses={callOffs.addresses}
          userNames={callOffs.userNames}
        />
      )}

      <OrderWorkOrdersPanel workOrders={workOrders} />

      <section className="space-y-3">
        <h2 className="flex items-baseline gap-3 border-b pb-2 text-base font-semibold">
          Order lines
          <span className="text-xs font-normal text-muted-foreground">
            {order.items.length} {pluralize(order.items.length, "line")}
          </span>
        </h2>
        {/* `New · Delete · Sawing specifications · PAC · New… · Price
            correction · End call-off` on the reference; none of them is built
            on a saved order here, so all are greyed. */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
          {[
            "New",
            "Delete",
            "Sawing specifications",
            "PAC",
            "New…",
            "Price correction",
            "End call-off",
          ].map((label) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="sm"
              disabled
              title={LINE_NOT_BUILT}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="whitespace-nowrap">
                <TableHead className="text-right">Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Delivery date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Qty (p)</TableHead>
                <TableHead>U</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="text-right">Width</TableHead>
                <TableHead className="text-right">Thick.</TableHead>
                <TableHead className="text-right">Kg (p)</TableHead>
                <TableHead className="text-right">M1 (p)</TableHead>
                <TableHead className="text-right">Net Price</TableHead>
                <TableHead>U</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Purchase price</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Profit amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={22}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No lines on this order.
                  </TableCell>
                </TableRow>
              ) : (
                order.items.map((item) => {
                  const meters = runningMeters({
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    lengthMm: item.lengthMm,
                  });

                  return (
                    <TableRow
                      key={item.uuid}
                      className={cn(
                        "whitespace-nowrap",
                        item.uuid === linePanels?.orderItemUuid &&
                          "bg-primary/5 outline outline-primary/20",
                      )}
                    >
                      <TableCell className="text-right">
                        <Link
                          href={`/orders/${order.uuid}?line=${item.uuid}`}
                          scroll={false}
                          aria-current={
                            item.uuid === linePanels?.orderItemUuid
                              ? "true"
                              : undefined
                          }
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {item.lineNumber ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {ORDER_SOURCE_TYPE_LABELS[item.sourceType]}
                      </TableCell>
                      <TableCell>{formatDateColumn(item.deliveryDate)}</TableCell>
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
                        {orDash(item.productCode)}
                      </TableCell>
                      <TableCell>{orDash(item.productName)}</TableCell>
                      <TableCell>{orDash(item.stockCategory)}</TableCell>
                      <TableCell>{orDash(item.quality)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(item.quantity))}
                      </TableCell>
                      <TableCell>
                        {item.unit ? STOCK_UNIT_LABELS[item.unit] : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(item.lengthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(item.widthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(item.thicknessMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(Number(item.kgPlanned ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {meters ? formatNumber(meters) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(item.netPrice ?? 0))}
                      </TableCell>
                      <TableCell>
                        {orDash(item.priceUnit ? item.priceUnit.toUpperCase() : null)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(item.amount ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(item.costPrice ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(item.costAmount ?? 0))}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          item.profitTooLow && "text-destructive",
                        )}
                      >
                        {formatPercent(Number(item.profitMargin ?? 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(item.profit ?? 0))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Scoped to the SELECTED line, the way the reference scopes them: a
          seller picks a line and then asks what stock there is, what this
          customer paid before, and what has shipped. See
          `docs/reference-system/order-detail.md` §10. */}
      {linePanels && (
        <OrderLinePanelsView
          panels={linePanels}
          lineLabel={selectedLineLabel}
          texts={texts}
        />
      )}

      {/* Scoped to the ORDER again: what was sent, who else sells here, what
          was billed and on what terms. */}
      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Order</h2>
        <OrderCommunicationPanel rows={communications} />
        <OrderCompetitorsPanel rows={competitors} />
        <OrderInvoiceLinesPanel rows={invoiceLines} />
        <OrderFinancesPanel order={order} />
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleCancel}
        isPending={isPending}
        title="Cancel order"
        description="This cancels the order and releases any stock it had reserved. This cannot be undone."
        confirmLabel="Cancel Order"
      />
    </div>
  );
};
