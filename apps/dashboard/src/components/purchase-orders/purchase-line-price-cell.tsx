"use client";

import { KeyboardEvent, useState, useTransition } from "react";
import { updatePurchaseLinePrice } from "@/app/(dashboard)/purchase-orders/actions";
import { Input } from "@/components/shadcn/input";
import { formatMoney } from "@/lib/helpers";

type Props = {
  purchaseOrderItemUuid: string;
  netPrice: string | null;
  /** Typeable while the line can still be priced. */
  editable: boolean;
  onError: (error: string | undefined) => void;
};

/**
 * `Net Price` on a purchase line, typed in the grid as the reference has it.
 * Leaving the cell saves it; the amount, the order's total and the cost of a
 * `CD` sale bought on the line follow.
 */
export const PurchaseLinePriceCell = ({
  purchaseOrderItemUuid,
  netPrice,
  editable,
  onError,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<string | null>(null);
  const saved = String(Number(netPrice ?? 0));

  if (!editable) {
    return <span>{formatMoney(Number(netPrice ?? 0))}</span>;
  }

  const save = () => {
    if (draft === null || isPending) {
      return;
    }
    const typed = draft.trim().replace(",", ".");
    if (Number(typed) === Number(saved)) {
      setDraft(null);
      return;
    }
    onError(undefined);
    startTransition(async () => {
      const result = await updatePurchaseLinePrice(purchaseOrderItemUuid, typed);
      if (result.error) {
        onError(result.error);
        return;
      }
      setDraft(null);
    });
  };

  // Enter leaves the cell rather than submitting anything around it.
  const leaveOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      className="w-24 text-right"
      aria-label="Net Price"
      value={draft ?? saved}
      disabled={isPending}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={leaveOnEnter}
      onBlur={save}
    />
  );
};
