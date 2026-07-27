"use client";

import { recalculateProductPrices } from "@/app/(dashboard)/product-prices/actions";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { pluralize } from "@/lib/helpers";
import { Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const RecalculatePricesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [markup, setMarkup] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await recalculateProductPrices(Number(markup));
      if (result.error) {
        setError(result.error);
        return;
      }
      const updated = result.updated ?? 0;
      setMessage(`Repriced ${updated} ${pluralize(updated, "product")}.`);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-end gap-3">
        <div className="w-32">
          <FormLabel htmlFor="default-markup">Default markup %</FormLabel>
          <Input
            id="default-markup"
            type="number"
            inputMode="decimal"
            min={0}
            value={markup}
            onChange={(event) => setMarkup(event.target.value)}
          />
        </div>
        <Button type="button" onClick={onClick} disabled={isPending}>
          <Calculator className="mr-1.5 size-4" />
          {isPending ? "Recalculating…" : "Recalculate prices"}
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
};
