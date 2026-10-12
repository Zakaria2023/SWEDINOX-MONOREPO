"use client";

import { convertPurchaseRequestToQuote } from "@/app/(dashboard)/purchase-requests/actions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { FormError } from "@/components/ui/form-error";
import { useState, useTransition } from "react";

type Props = {
  requestUuid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The request toolbar's `Purchase quote`, as the reference asks it on 800010
 * (12-10-2026): one confirmation, then the whole request becomes a quote for
 * its own supplier and that quote opens. Asking other suppliers stays on the
 * quotes panel's `Ask suppliers`.
 */
export const PurchaseRequestConvertDialog = ({
  requestUuid,
  open,
  onOpenChange,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const convert = () => {
    setError(undefined);
    startTransition(async () => {
      // Redirects to the new quote on success.
      const result = await convertPurchaseRequestToQuote(requestUuid);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Purchase quote</DialogTitle>
          <DialogDescription>
            This converts the entire purchase request into a purchase quote.
            Choose Cancel if this is not intended.
          </DialogDescription>
        </DialogHeader>
        <FormError>{error}</FormError>
        <DialogFooter className="pt-4">
          <Button type="button" onClick={convert} disabled={isPending}>
            {isPending ? "Converting…" : "OK"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
