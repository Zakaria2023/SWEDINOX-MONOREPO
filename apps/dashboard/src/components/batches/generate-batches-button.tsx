"use client";

import { generateBatches } from "@/app/(dashboard)/batches/actions";
import { Button } from "@/components/shadcn/button";
import { pluralize } from "@/lib/helpers";
import { Boxes } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const GenerateBatchesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await generateBatches();
      if (result.error) {
        setError(result.error);
        return;
      }
      const created = result.createdBatches ?? 0;
      setMessage(
        `Registered ${created} ${pluralize(created, "batch", "batches")}.`,
      );
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <Boxes className="mr-1.5 size-4" />
        {isPending ? "Registering…" : "Register from receipts"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
};
