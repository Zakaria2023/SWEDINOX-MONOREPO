"use client";

import { splitPurchaseReceival } from "@/app/(dashboard)/purchase-receivals/actions";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { formatNumber } from "@/lib/helpers";
import { Split } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  receivalUuid: string;
  plannedKg: number;
  /** A reception that has already taken goods can no longer be divided. */
  arrivedKg: number;
};

/**
 * Splits a reception into two instalments.
 *
 * This is how one purchase line comes to show several rows on the overview: the
 * supplier says it will ship in parts, so the expected reception is divided and
 * each part gets its own arrival date and status. The weight typed here leaves
 * this reception and becomes the second one, so the two always still add up to
 * what the line is owed.
 */
export const PurchaseReceivalSplit = ({
  receivalUuid,
  plannedKg,
  arrivedKg,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [splitKg, setSplitKg] = useState("");
  const [error, setError] = useState<string | undefined>();

  if (arrivedKg > 0) {
    return (
      <p className="text-sm text-muted-foreground">
        These goods have arrived, so this receipt can no longer be divided.
      </p>
    );
  }

  if (plannedKg <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This receipt carries no planned weight, so there is nothing to divide.
      </p>
    );
  }

  const split = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await splitPurchaseReceival(receivalUuid, Number(splitKg));
      if (result.error) {
        setError(result.error);
        return;
      }
      setSplitKg("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label
            htmlFor="splitKg"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            Weight to split off (kg)
          </label>
          <Input
            id="splitKg"
            inputMode="decimal"
            value={splitKg}
            onChange={(event) => setSplitKg(event.target.value)}
            placeholder={`0 – ${formatNumber(plannedKg)}`}
            className="w-44"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={split}
          disabled={isPending || splitKg.trim() === ""}
        >
          <Split className="me-1.5 size-4" />
          {isPending ? "Splitting…" : "Split"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        The second instalment takes this weight; this one keeps the rest.
      </p>
      {error && <FormError>{error}</FormError>}
    </div>
  );
};
