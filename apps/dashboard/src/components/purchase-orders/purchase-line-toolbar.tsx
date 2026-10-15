"use client";

import {
  closePurchaseLine,
  PurchaseOrderItemDetail,
} from "@/app/(dashboard)/purchase-orders/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { formatNumber, purchaseLineActions } from "@/lib/helpers";
import {
  BellRing,
  Boxes,
  Calculator,
  CircleSlash,
  Eye,
  Package,
  Plus,
  Scissors,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

// The reference's Lines toolbar on a saved order: `New · Delete · Sawing
// specifications · (product) · (stock) · Calculate · PAC · Pre-notify · View`
// (404355, 9–15-10-2026), then the option shortcuts.
// Adding and deleting lines on a saved order is not built yet, so those two
// are greyed with the reason; `Close line` is ours.
const OPTION_SHORTCUTS = ["DUPK320", "NG", "K320", "BF", "F", "L", "K", "LSR"];

type Props = {
  selected: PurchaseOrderItemDetail | null;
  /** The order's own `Pre-notify`, which the line toolbar repeats. */
  onPreNotify: () => void;
  /** Asleep on a provisional order, as the header's button is. */
  canPreNotify: boolean;
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
export const PurchaseLineToolbar = ({
  selected,
  onPreNotify,
  canPreNotify,
}: Props) => {
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
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          title="Adding a line to a saved order is not built yet"
        >
          <Plus size={16} className="text-primary" />
          New
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          title="Deleting a line from a saved order is not built yet"
        >
          <X size={16} className="text-destructive" />
          Delete
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled>
          <Scissors size={16} />
          Sawing specifications
        </Button>
        {/* The two icons beside it: the selected line's article, and that
            article's stock. */}
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          disabled={!selected}
          aria-label="Show product"
          title="Show product"
          render={
            <Link
              href={selected ? `/products/${selected.productUuid}` : "#"}
            />
          }
        >
          <Package size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          disabled={!selected}
          aria-label="Stock"
          title="Stock"
          render={
            <Link
              href={
                selected
                  ? `/stock-on-location?q=${encodeURIComponent(selected.productCode)}`
                  : "#"
              }
            />
          }
        >
          <Boxes size={16} />
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled>
          <Calculator size={16} />
          Calculate
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled>
          PAC
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canPreNotify}
          onClick={onPreNotify}
        >
          <BellRing size={16} />
          Pre-notify
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled>
          <Eye size={16} />
          View
        </Button>
        <span className="mx-1 h-5 border-l" />
        {OPTION_SHORTCUTS.map((option) => (
          <Button
            key={option}
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="h-7 px-2 text-xs"
            title="Options are added on the Options panel"
          >
            {option}
          </Button>
        ))}
        <span className="mx-1 h-5 border-l" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
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
