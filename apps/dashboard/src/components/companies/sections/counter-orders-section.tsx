"use client";

import { CompanyCounterOrderInput } from "@/app/(dashboard)/companies/actions";
import { COUNTER_ORDER_STATUS_LABELS } from "@/lib/labels";
import { Pencil, Plus, ShoppingCart, X } from "lucide-react";
import { RowAction } from "@/components/ui/row-action";

type Props = {
  counterOrders: CompanyCounterOrderInput[];
  removeCounterOrder: (index: number) => void;
  handleOpenCounterOrder: () => void;
  handleEditCounterOrder: (index: number) => void;
  isPending: boolean;
};

export const CounterOrdersSection = ({
  counterOrders,
  removeCounterOrder,
  handleOpenCounterOrder,
  handleEditCounterOrder,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
      Counter Orders
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {counterOrders.map((order, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <ShoppingCart className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-muted-foreground">
              {order.orderDate || "Counter order"}
            </span>
            {order.status && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {COUNTER_ORDER_STATUS_LABELS[order.status]}
              </span>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              € {order.amountExVat ?? "0.00"}
            </span>
            {order.handlingBlocked && (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                Blocked
              </span>
            )}
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              0 days in system
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <RowAction
              onClick={() => handleEditCounterOrder(index)}
              label="Edit counter order"
              tone="edit"
              disabled={isPending}
            >
              <Pencil className="size-4" />
            </RowAction>
            <button
              type="button"
              onClick={() => removeCounterOrder(index)}
              className="text-muted-foreground hover:text-destructive"
              disabled={isPending}
            >
              <X className="size-4" />
              <span className="sr-only">Remove counter order</span>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenCounterOrder}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Counter Order
      </button>
    </div>
  </section>
);
