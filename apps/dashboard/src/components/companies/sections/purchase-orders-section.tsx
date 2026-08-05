"use client";

import { CompanyPurchaseOrderInput } from "@/app/(dashboard)/companies/actions";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { PackageCheck, Pencil, Plus, X } from "lucide-react";

type Props = {
  purchaseOrders: CompanyPurchaseOrderInput[];
  removePurchaseOrder: (index: number) => void;
  handleOpenPurchaseOrder: () => void;
  handleEditPurchaseOrder: (index: number) => void;
  isPending: boolean;
};

export const PurchaseOrdersSection = ({
  purchaseOrders,
  removePurchaseOrder,
  handleOpenPurchaseOrder,
  handleEditPurchaseOrder,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
      Purchase Orders
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {purchaseOrders.map((order, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <PackageCheck className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-muted-foreground">
              {order.orderDate || "Purchase order"}
            </span>
            {order.status && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {PURCHASE_ORDER_STATUS_LABELS[order.status]}
              </span>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              € {order.amount ?? "0.00"}
            </span>
            {order.reference && (
              <span className="truncate text-xs text-muted-foreground">
                {order.reference}
              </span>
            )}
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              0 days in system
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => handleEditPurchaseOrder(index)}
              className="text-muted-foreground hover:text-primary"
              disabled={isPending}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit purchase order</span>
            </button>
            <button
              type="button"
              onClick={() => removePurchaseOrder(index)}
              className="text-muted-foreground hover:text-destructive"
              disabled={isPending}
            >
              <X className="size-4" />
              <span className="sr-only">Remove purchase order</span>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenPurchaseOrder}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Purchase Order
      </button>
    </div>
  </section>
);
