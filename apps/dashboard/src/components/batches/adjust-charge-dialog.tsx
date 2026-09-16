"use client";

import {
  adjustBatchCharge,
  getInternalChargeOptions,
  InternalChargeOption,
} from "@/app/(dashboard)/batches/actions";
import {
  adjustChargeSchema,
  AdjustChargeValues,
} from "@/app/(dashboard)/batches/validation";
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
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { orDash } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  batchUuid: string;
  charge: string | null;
  sheetNumber: string | null;
  internalCharge: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The reference's *Charge aanpassen*: the current heat number, sheet number and
 * internal charge read-only above, the new ones below. The internal charge is
 * picked from those already issued — never typed.
 */
export const AdjustChargeDialog = ({
  batchUuid,
  charge,
  sheetNumber,
  internalCharge,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(adjustBatchCharge, {});
  const [chargeOptions, setChargeOptions] = useState<InternalChargeOption[]>(
    [],
  );

  const defaults: AdjustChargeValues = {
    charge: charge ?? "",
    sheetNumber: sheetNumber ?? "",
    internalCharge: "",
  };

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AdjustChargeValues>({
    resolver: zodResolver(adjustChargeSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const request = { cancelled: false };
    getInternalChargeOptions(batchUuid).then((options) => {
      if (!request.cancelled) {
        setChargeOptions(options);
      }
    });
    return () => {
      request.cancelled = true;
    };
  }, [open, batchUuid]);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const handleReset = () =>
    reset({ charge: charge ?? "", sheetNumber: sheetNumber ?? "", internalCharge: "" });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, batchUuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust charge</DialogTitle>
            <DialogDescription>
              Correct the heat number or sheet number, or move this batch under
              an internal charge that already exists.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
              <dt className="text-muted-foreground">Current charge</dt>
              <dd>{orDash(charge)}</dd>
              <dt className="text-muted-foreground">Current sheet number</dt>
              <dd>{orDash(sheetNumber)}</dd>
              <dt className="text-muted-foreground">
                Current internal charge
              </dt>
              <dd className="font-medium">{orDash(internalCharge)}</dd>
            </dl>

            <div>
              <FormLabel htmlFor="adjust-charge">New charge</FormLabel>
              <Input id="adjust-charge" {...register("charge")} />
              <FormFieldError message={errors.charge?.message} />
            </div>
            <div>
              <FormLabel htmlFor="adjust-sheet-number">
                New sheet number
              </FormLabel>
              <Input id="adjust-sheet-number" {...register("sheetNumber")} />
              <FormFieldError message={errors.sheetNumber?.message} />
            </div>
            <div>
              <FormLabel htmlFor="adjust-internal-charge">
                New internal charge
              </FormLabel>
              <Controller
                control={control}
                name="internalCharge"
                render={({ field }) => (
                  <Select
                    id="adjust-internal-charge"
                    value={field.value}
                    options={[
                      { value: "", label: "Keep the current internal charge" },
                      ...chargeOptions,
                    ]}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
