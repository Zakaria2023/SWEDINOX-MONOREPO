"use client";

import { generateOptionCharges } from "@/app/(dashboard)/options/actions";
import { Button } from "@/components/shadcn/button";
import { pluralize } from "@/lib/helpers";
import { Hammer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const GenerateOptionChargesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await generateOptionCharges();
      if (result.error) {
        setError(result.error);
        return;
      }
      const created = result.createdCharges ?? 0;
      setMessage(`Booked ${created} option ${pluralize(created, "charge")}.`);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <Hammer className="mr-1.5 size-4" />
        {isPending ? "Booking…" : "Generate from order lines"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
};
