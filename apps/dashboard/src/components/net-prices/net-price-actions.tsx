"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteNetPrice } from "@/app/(dashboard)/net-prices/actions";
import { Button } from "@/components/shadcn/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { Trash2 } from "lucide-react";

type Props = {
  netPriceUuid: string;
};

export const NetPriceActions = ({ netPriceUuid }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const remove = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteNetPrice(netPriceUuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  return (
    <div className="space-y-2">
      {error && <FormError>{error}</FormError>}
      <div className="flex gap-2">
        <Button
          variant="outline"
          render={<Link href={`/net-prices/${netPriceUuid}/edit`} />}
        >
          Edit net price
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isPending}
        >
          <Trash2 className="mr-1.5 size-4" />
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={remove}
        isPending={isPending}
        title="Delete this net price"
        description="Documents priced under this contract will fall back to the contract's discounts. This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
};
