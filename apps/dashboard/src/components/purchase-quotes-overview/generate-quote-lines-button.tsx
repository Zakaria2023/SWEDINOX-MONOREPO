"use client";

import { generatePurchaseQuoteLines } from "@/app/(dashboard)/purchase-quotes-overview/actions";
import { Button } from "@/components/shadcn/button";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const GenerateQuoteLinesButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const result = await generatePurchaseQuoteLines();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <FileText className="mr-1.5 size-4" />
        {isPending ? "Generating…" : "Generate quote lines"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
