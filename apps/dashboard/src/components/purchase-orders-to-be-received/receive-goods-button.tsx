"use client";

import { receiveOutstandingGoods } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { Button } from "@/components/shadcn/button";
import { PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const ReceiveGoodsButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const result = await receiveOutstandingGoods();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={isPending}>
        <PackageCheck className="mr-1.5 size-4" />
        {isPending ? "Receiving…" : "Receive goods"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
