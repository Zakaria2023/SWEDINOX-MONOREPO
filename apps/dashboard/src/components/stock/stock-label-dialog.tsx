"use client";

import {
  printStockLabel,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
import {
  StockLabelFormValues,
  stockLabelSchema,
} from "@/app/(dashboard)/stock/validation";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { stockLabelTypes } from "@/lib/enums";
import { STOCK_LABEL_TYPE_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  data: StockLotDialogData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Voorraadlabel` — the reference's `Selecteer type voorraadlabel en aantal`.
 *
 * Two label types, `Label` and `Sticker`; a count per line defaulting to 1; and
 * ☐ `Gebruik printers op locatie` — *use the printers at the location* — which
 * tells us **printers are configured per warehouse location**.
 *
 * We had no label printing at all.
 *
 * ⚠️ There is no printer behind this yet, and it does not pretend otherwise:
 * what it does is record the request, so a print is auditable and the printing
 * integration has one place to read from when it exists. A label that silently
 * went nowhere would be worse than one that is queued.
 */
export const StockLabelDialog = ({ data, open, onOpenChange }: Props) => {
  const { lot } = data;
  const [state, dispatch, isPending] = useActionState(printStockLabel, {});

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockLabelFormValues>({
    resolver: zodResolver(stockLabelSchema),
    defaultValues: {
      stockUuid: lot.uuid,
      labelType: "label",
      copies: "1",
      useLocationPrinters: false,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, stockUuid: lot.uuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Stock label</DialogTitle>
            <DialogDescription>
              Choose the label type and how many to print.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="label-type" required>
                Label type
              </FormLabel>
              <Controller
                control={control}
                name="labelType"
                render={({ field }) => (
                  <Select
                    id="label-type"
                    value={field.value}
                    options={stockLabelTypes.map((value) => ({
                      value,
                      label: STOCK_LABEL_TYPE_LABELS[value],
                    }))}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <FormFieldError message={errors.labelType?.message} />
            </div>

            <div>
              <FormLabel htmlFor="label-copies" required>
                Amount (per line)
              </FormLabel>
              <Input
                id="label-copies"
                inputMode="numeric"
                {...register("copies")}
              />
              <FormFieldError message={errors.copies?.message} />
            </div>

            <Controller
              control={control}
              name="useLocationPrinters"
              render={({ field }) => (
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  <span>
                    Use the printers at the location
                    <span className="block text-xs text-muted-foreground">
                      Printers are configured per warehouse location, so this
                      sends the labels to the ones at {lot.locationName ?? "this lot’s location"}.
                    </span>
                  </span>
                </label>
              )}
            />

            {state.message ? (
              <p className="text-sm text-green-700">{state.message}</p>
            ) : null}
            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Queueing…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
