"use client";

import { generateOptionPrices } from "@/app/(dashboard)/option-prices-per-product/actions";
import { Button } from "@/components/shadcn/button";
import { pluralize } from "@/lib/helpers";
import { Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const GenerateOptionPricesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await generateOptionPrices();
      if (result.error) {
        setError(result.error);
        return;
      }
      const created = result.createdRows ?? 0;
      setMessage(`Opened ${created} option ${pluralize(created, "price")}.`);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <Wrench className="mr-1.5 size-4" />
        {isPending ? "Pricing…" : "Price options per product"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
};
