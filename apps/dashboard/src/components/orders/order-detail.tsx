"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cancelOrder, OrderDetail } from "@/app/(dashboard)/orders/actions";
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
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import {
  cn,
  formatMoney,
  formatPercent,
  orderSummaryFromSnapshot,
} from "@/lib/helpers";
import { ORDER_ITEM_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  order: OrderDetail;
};

export const OrderDetailView = ({ order }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const canCancel = order.status !== "cancelled";

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
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Products</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
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
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No products on this order.
                  </TableCell>
                </TableRow>
              ) : (
                order.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell>
                      {ORDER_ITEM_STATUS_LABELS[item.status]}
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
