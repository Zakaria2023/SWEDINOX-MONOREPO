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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { PURCHASE_ORDER_STATUS_LABELS, STOCK_STATUS_LABELS } from "@/lib/labels";

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
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Stock Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No products on this order.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrder.items.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="font-medium">
                      {[item.productCode, item.productName]
                        .filter(Boolean)
                        .join(" — ")}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.orderedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.stockQuantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      {item.stockStatus
                        ? STOCK_STATUS_LABELS[item.stockStatus]
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {canCancel && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href={`/purchase-orders/${purchaseOrder.uuid}/edit`} />}
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
