"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import {
  expirePurchaseQuote,
  PurchaseQuoteDetail,
} from "@/app/(dashboard)/purchase-quotes/actions";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { isPurchaseQuoteEditable } from "@/lib/helpers";
import { PURCHASE_QUOTE_EXPIRATION_REASON_LABELS } from "@/lib/labels";

type Props = {
  /** The saved quote; null on a new one. */
  existing: PurchaseQuoteDetail | null;
};

/**
 * The reference's `Follow-up` block on a quote: `Expired because:` →
 * `Incorrectly entered` on 900000. The overview's `Expiration reason` is this
 * field. A buyer closes an undecided quote here; a lapsed `Valid u/i` closes it
 * by itself.
 */
export const PurchaseQuoteFollowUpSection = ({ existing }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [isExpireOpen, setIsExpireOpen] = useState(false);

  const reason = existing?.expirationReason
    ? PURCHASE_QUOTE_EXPIRATION_REASON_LABELS[existing.expirationReason]
    : "";
  const canExpire =
    existing !== null && isPurchaseQuoteEditable(existing.status);

  const expireAsIncorrect = () => {
    if (!existing) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await expirePurchaseQuote(
        existing.uuid,
        "incorrectly_entered",
      );
      setIsExpireOpen(false);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Follow-up</h2>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <FormLabel htmlFor="expiredBecause">Expired because:</FormLabel>
          <Input id="expiredBecause" value={reason} readOnly disabled />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpireOpen(true)}
          disabled={!canExpire || isPending}
          title={existing ? undefined : "Save the purchase quote first"}
        >
          <Ban className="me-1.5 size-4" />
          Expire…
        </Button>
      </div>
      <FormError>{error}</FormError>

      <ConfirmDialog
        open={isExpireOpen}
        onOpenChange={setIsExpireOpen}
        onConfirm={expireAsIncorrect}
        isPending={isPending}
        title="Expire this quote"
        description="The quote is closed as incorrectly entered. It can no longer be priced, edited or turned into a purchase order."
        confirmLabel="Expire"
      />
    </section>
  );
};
