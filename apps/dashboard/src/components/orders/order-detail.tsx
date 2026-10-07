"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  OrderCallOffAddressOption,
  OrderCallOffRow,
  OrderInvoiceLineRow,
  OrderLinePanels,
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
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatPercent,
  orderSummaryFromSnapshot,
} from "@/lib/helpers";
import { ORDER_ITEM_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  order: OrderDetail;
  workOrders: OrderWorkOrders;
  communications: OrderCommunicationRow[];
  competitors: OrderCompetitorRow[];
  invoiceLines: OrderInvoiceLineRow[];
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
  workOrders,
  invoiceLines,
  linePanels,
  communications,
  competitors,
  callOffs,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const canCancel = order.status !== "cancelled";
  // Making an order final is the one press that raises the picking and the
  // transport job, so it is only offered while the order is still a typed
  // document nobody has released.
  const canMakeFinal = order.status === "provisional";

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

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          <p className="text-sm">{order.companyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Contact
          </p>
          <p className="text-sm">
            {[order.contactFirstName, order.contactLastName]
              .filter(Boolean)
              .join(" ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm">{ORDER_STATUS_LABELS[order.status]}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer Ref
          </p>
          <p className="text-sm">{order.customerRef ?? "—"}</p>
        </div>
        {order.orderType === "call_off" && (
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Call-off period
            </p>
            <p className="text-sm">
              {formatDateColumn(order.callOffPeriodFrom)} up to and including{" "}
              {formatDateColumn(order.callOffPeriodTo)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Products</h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Net price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No products on this order.
                  </TableCell>
                </TableRow>
              ) : (
                order.items.map((item) => (
                  <TableRow
                    key={item.uuid}
                    className={cn(
                      item.uuid === linePanels?.orderItemUuid &&
                        "bg-primary/5 outline outline-primary/20",
                    )}
                  >
                    <TableCell>
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
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={item.status}
                        label={
                          item.status
                            ? ORDER_ITEM_STATUS_LABELS[item.status]
                            : null
                        }
                      />
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
                      {formatMoney(Number(item.profit ?? 0))}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        item.profitTooLow && "text-destructive",
                      )}
                    >
                      {formatPercent(Number(item.profitMargin ?? 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Scoped to the SELECTED line, the way the reference scopes them: a
          seller picks a line and then asks what stock there is, what this
          customer paid before, and what has shipped. See
          `docs/reference-system/order-detail.md` §10. */}
      {linePanels && (
        <OrderLinePanelsView
          panels={linePanels}
          lineLabel={selectedLineLabel}
        />
      )}

      {/* Scoped to the ORDER, unlike everything above. */}
      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Order</h2>
        {callOffs && (
          <OrderCallOffsPanel
            orderUuid={order.uuid}
            rows={callOffs.rows}
            addresses={callOffs.addresses}
            userNames={callOffs.userNames}
          />
        )}
        <OrderWorkOrdersPanel workOrders={workOrders} />
        <OrderCommunicationPanel rows={communications} />
        <OrderCompetitorsPanel rows={competitors} />
        <OrderInvoiceLinesPanel rows={invoiceLines} />
        <OrderFinancesPanel order={order} />
      </div>

      {/* The order's own rollup — costed against the stock lots actually
          allocated to it, so it can report a truer margin than the quote. */}
      <QuoteSummaryPanel summary={orderSummaryFromSnapshot(order)} />

      {canCancel && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/orders/${order.uuid}/edit`} />}
          >
            Edit Details
          </Button>
          {canMakeFinal && (
            <>
              <Button
                type="button"
                onClick={() => handleMakeFinal(false)}
                disabled={isPending}
              >
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
          {/* `Send… · Show company · Invoice` from the reference's order
              toolbar. Invoicing starts the invoice form on this customer,
              which offers what is delivered and still to bill. */}
          <Button
            type="button"
            variant="outline"
            onClick={handleSend}
            disabled={isPending || canMakeFinal}
          >
            Send…
          </Button>
          <Button
            variant="outline"
            render={<Link href={`/companies/${order.companyUuid}`} />}
          >
            Show company
          </Button>
          {canMakeFinal ? (
            <Button variant="outline" disabled>
              Invoice
            </Button>
          ) : (
            <Button
              variant="outline"
              render={
                <Link href={`/invoices/add?company=${order.companyUuid}`} />
              }
            >
              Invoice
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending}
          >
            Cancel Order
          </Button>
        </div>
      )}

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
