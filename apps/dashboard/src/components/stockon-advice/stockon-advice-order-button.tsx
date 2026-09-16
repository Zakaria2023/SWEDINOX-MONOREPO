"use client";

import { createPurchaseOrderFromAdvice } from "@/app/(dashboard)/stockon-advice/actions";
import { Button } from "@/components/shadcn/button";
import { ShoppingCart } from "lucide-react";
import { useState, useTransition } from "react";

type Props = {
  productUuid: string;
  /** What the advice says to buy, in the unit the product is bought by. */
  toOrder: number | null;
};

/**
 * Raises the advised purchase order for one product.
 *
 * The action redirects to the new order when it succeeds, so anything that
 * comes back is a reason it could not — most often a product with no preferred
 * supplier to order from — and it is shown on the row that caused it rather
 * than swallowed.
 */
export const StockOnAdviceOrderButton = ({ productUuid, toOrder }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const order = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await createPurchaseOrderFromAdvice(productUuid);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  if (toOrder === null || toOrder <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={order}
        disabled={isPending}
      >
        <ShoppingCart className="me-1.5 size-4" />
        {isPending ? "Ordering…" : "Order"}
      </Button>
      {error && <p className="max-w-56 text-xs text-destructive">{error}</p>}
    </div>
  );
};
