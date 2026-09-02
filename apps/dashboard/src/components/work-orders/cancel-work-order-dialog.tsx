"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/helpers";

export type CancelWorkOrderMode = "restore" | "close_at_zero";

export type CancelWorkOrder = (
  workOrderUuid: string,
  mode: CancelWorkOrderMode,
) => Promise<{ error?: string; success?: boolean }>;

type Props = {
  workOrderUuid: string | null;
  cancel: CancelWorkOrder;
  /** Where to go once the job is gone — its overview. */
  returnTo: string;
  onOpenChange: (open: boolean) => void;
};

type ModeOption = {
  value: CancelWorkOrderMode;
  label: string;
  description: string;
};

// Two different answers to "this job is not happening". One hands the demand
// back to be planned again; the other says the goods are never going.
const MODE_OPTIONS: ModeOption[] = [
  {
    value: "restore",
    label: "Delete the work order and restore the delivery",
    description:
      "The order lines go back to waiting to be planned, and a new job can be raised for them.",
  },
  {
    value: "close_at_zero",
    label: "Cancel the order by delivering nothing",
    description:
      "The order lines are finished short. Nothing will be made or picked for them.",
  },
];

export const CancelWorkOrderDialog = ({
  workOrderUuid,
  cancel,
  returnTo,
  onOpenChange,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<CancelWorkOrderMode>("restore");
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    if (workOrderUuid) {
      setMode("restore");
      setFormError(undefined);
    }
  }, [workOrderUuid]);

  const confirm = () => {
    if (!workOrderUuid) {
      return;
    }
    startTransition(async () => {
      const result = await cancel(workOrderUuid, mode);

      if (result.success) {
        onOpenChange(false);
        router.push(returnTo);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  };

  return (
    <Dialog open={!!workOrderUuid} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Restore or Cancel Delivery</DialogTitle>
          <DialogDescription>
            No stock has moved yet, so there is nothing to put back either way.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-md border p-3",
                mode === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <input
                type="radio"
                name="cancel-mode"
                className="mt-1"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                disabled={isPending}
              />
              <span>
                <span className="block text-sm font-medium">
                  {option.label}
                </span>
                <span className="text-muted-foreground block text-sm">
                  {option.description}
                </span>
              </span>
            </label>
          ))}

          <FormError>{formError}</FormError>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Keep it
          </Button>
          <Button type="button" onClick={confirm} disabled={isPending}>
            {isPending ? "Cancelling..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
