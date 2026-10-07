"use client";

import {
  closePurchaseLine,
  PurchaseOrderItemDetail,
} from "@/app/(dashboard)/purchase-orders/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { formatNumber, purchaseLineActions } from "@/lib/helpers";
import { CircleSlash } from "lucide-react";
import { useState, useTransition } from "react";

type Props = {
  selected: PurchaseOrderItemDetail | null;
};

/**
 * The toolbar above the order's line grid, acting on the selected line.
 *
 * Today it carries one action, `Close line`, for a line that arrived short and
 * whose remainder is not coming. The reference closes such lines rather than
 * leaving them open: 22 of the 23 short lines since 2024 are `Received` or
 * `Invoiced`, one at 6 plates of 17 (J4, 7-10-2026). The rule for when it may
 * be pressed lives in `purchaseLineActions`, beside the status rule it mirrors.
 */
export const PurchaseLineToolbar = ({ selected }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  const permitted = purchaseLineActions(selected);

  const onClose = () => {
    if (!selected) {
      return;
    }
    startTransition(async () => {
      const result = await closePurchaseLine(selected.uuid);
      setError(result.error);
      setIsCloseOpen(false);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!permitted.canClose || isPending}
          onClick={() => setIsCloseOpen(true)}
        >
          <CircleSlash size={16} />
          Close line
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{permitted.closeReason}</p>

      <FormError>{error}</FormError>

      {selected && (
        <ConfirmDialog
          open={isCloseOpen}
          onOpenChange={setIsCloseOpen}
          title="Close this line short?"
          description={`${formatNumber(Number(selected.qtyReceived ?? 0))} of ${formatNumber(Number(selected.orderedQuantity))} arrived. Closing the line accepts that and stops waiting for the rest: any reception still expecting goods lapses, and the line reads Received.`}
          confirmLabel="Close line"
          isPending={isPending}
          onConfirm={onClose}
        />
      )}
    </div>
  );
};
