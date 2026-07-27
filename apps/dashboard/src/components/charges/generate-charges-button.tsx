"use client";

import { generateChargesFromOrders } from "@/app/(dashboard)/charges/actions";
import { Button } from "@/components/shadcn/button";
import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const GenerateChargesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const result = await generateChargesFromOrders();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <Receipt className="mr-1.5 size-4" />
        {isPending ? "Generating…" : "Generate from orders"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
