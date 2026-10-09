"use client";

import { receivePurchaseOrderLine } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { Button } from "@/components/shadcn/button";
import { PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  /** The selected line; null greys the button until a row is picked. */
  purchaseOrderItemUuid: string | null;
};

export const ReceiveLineButton = ({ purchaseOrderItemUuid }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      if (!purchaseOrderItemUuid) {
        return;
      }
      setError(null);
      const result = await receivePurchaseOrderLine(purchaseOrderItemUuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isPending || !purchaseOrderItemUuid}
      >
        <PackageCheck className="mr-1 size-3.5" />
        {isPending ? "Receiving…" : "Receive"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
