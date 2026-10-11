"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  Mail,
  MessageSquareWarning,
  PackageX,
  Printer,
  ReceiptText,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import {
  creditPurchaseReturnOrder,
  dispatchPurchaseReturnOrder,
  makePurchaseReturnOrderFinal,
  PurchaseReturnOrderActionResult,
  PurchaseReturnOrderDetail,
} from "@/app/(dashboard)/purchase-return-orders/actions";
import { Button } from "@/components/shadcn/button";
import { FormError } from "@/components/ui/form-error";

const NOT_BUILT = "Not built yet";

type Props = {
  returnOrder: PurchaseReturnOrderDetail;
};

/**
 * The reference's toolbar on a saved return: `Make final · Print… · Send… ·
 * Show company · Show purchase order · Show complaint · Order lines · Stock on
 * location` (950034, 11-10-2026), then the two steps the goods take after it:
 * leaving for the supplier, and the supplier's credit note arriving.
 */
export const PurchaseReturnOrderToolbar = ({ returnOrder }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const isProvisional = returnOrder.status === "provisional";
  const isDispatched = returnOrder.status === "delivered";
  const isCredited = returnOrder.status === "invoiced";
  const isCancelled = returnOrder.status === "cancelled";

  const run = (action: () => Promise<PurchaseReturnOrderActionResult>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() =>
            run(() => makePurchaseReturnOrderFinal(returnOrder.uuid))
          }
          disabled={isPending || !isProvisional}
        >
          <BadgeCheck className="me-1.5 size-4" />
          Make final
        </Button>
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          <Printer className="me-1.5 size-4" />
          Print…
        </Button>
        <Button type="button" variant="outline" disabled title={NOT_BUILT}>
          <Mail className="me-1.5 size-4" />
          Send…
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/companies/${returnOrder.supplierUuid}`} />}
        >
          <Building2 className="me-1.5 size-4" />
          Show company
        </Button>
        {returnOrder.purchaseOrderUuid ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/purchase-orders/${returnOrder.purchaseOrderUuid}`} />
            }
          >
            <ShoppingCart className="me-1.5 size-4" />
            Show purchase order
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <ShoppingCart className="me-1.5 size-4" />
            Show purchase order
          </Button>
        )}
        {returnOrder.complaintUuid ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/complaints/${returnOrder.complaintUuid}`} />}
          >
            <MessageSquareWarning className="me-1.5 size-4" />
            Show complaint
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <MessageSquareWarning className="me-1.5 size-4" />
            Show complaint
          </Button>
        )}
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/purchase-lines" />}
        >
          <ClipboardList className="me-1.5 size-4" />
          Order lines
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/stock-on-location" />}
        >
          <Warehouse className="me-1.5 size-4" />
          Stock on location
        </Button>

        {/* Goods leaving and the supplier's credit arriving are two
            decisions, so they are two buttons. */}
        {!isCancelled && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                run(() => dispatchPurchaseReturnOrder(returnOrder.uuid))
              }
              disabled={isPending || isDispatched || isCredited}
              title="Takes the goods out of the lot they arrived in, at the price they were bought for."
            >
              <PackageX className="me-1.5 size-4" />
              {isDispatched || isCredited ? "Goods sent back" : "Send goods back"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                run(() => creditPurchaseReturnOrder(returnOrder.uuid))
              }
              disabled={isPending || !isDispatched}
              title="Reduces what we owe this supplier once the goods have left."
            >
              <ReceiptText className="me-1.5 size-4" />
              {isCredited ? "Credited" : "Book supplier credit note"}
            </Button>
          </>
        )}
      </div>
      <FormError>{error}</FormError>
    </div>
  );
};
