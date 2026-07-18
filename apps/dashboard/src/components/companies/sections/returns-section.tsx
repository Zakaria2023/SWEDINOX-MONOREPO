"use client";

import { CompanyReturnOrderInput } from "@/app/(dashboard)/companies/actions";
import {
  RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { Pencil, Plus, Undo2, X } from "lucide-react";

type Props = {
  returnOrders: CompanyReturnOrderInput[];
  removeReturnOrder: (index: number) => void;
  handleOpenReturnOrder: () => void;
  handleEditReturnOrder: (index: number) => void;
  isPending: boolean;
};

export const ReturnsSection = ({
  returnOrders,
  removeReturnOrder,
  handleOpenReturnOrder,
  handleEditReturnOrder,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
      Returns
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {returnOrders.map((order, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Undo2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-muted-foreground">
              {order.orderReference || order.orderDate || "Return"}
            </span>
            {order.status && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {RETURN_ORDER_STATUS_LABELS[order.status]}
              </span>
            )}
            {order.returnReason && (
              <span className="line-clamp-1 text-muted-foreground">
                {RETURN_ORDER_REASON_LABELS[order.returnReason]}
              </span>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              € {order.totalExclVat ?? "0.00"}
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
            <button
              type="button"
              onClick={() => handleEditReturnOrder(index)}
              className="text-muted-foreground hover:text-primary"
              disabled={isPending}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit return</span>
            </button>
            <button
              type="button"
              onClick={() => removeReturnOrder(index)}
              className="text-muted-foreground hover:text-destructive"
              disabled={isPending}
            >
              <X className="size-4" />
              <span className="sr-only">Remove return</span>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenReturnOrder}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Return
      </button>
    </div>
  </section>
);
