"use client";

import {
  LocationTreeRow,
  splitStockLot,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
import {
  StockSplitFormValues,
  stockSplitSchema,
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
import { LocationSearchField } from "@/components/stock/location-search-field";
import { StockLotLedger } from "@/components/stock/stock-lot-ledger";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  data: StockLotDialogData;
  locations: LocationTreeRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Splits` — the reference's `Splits voorraad`.
 *
 * The one dialog we had already guessed right, including the weight box. What
 * the 5-10-2026 capture added is the ledger on top and the certainty about what
 * is *absent*: **no `Reden` and no `Uitvoerdatum`**. Unlike a relocation, a
 * split is immediate — it is not planned warehouse work that becomes an order.
 *
 * 🔑 **The weighed weight is stated, not apportioned.** That is the whole point
 * of the box: the pieces coming off the bundle get put on the scale. A live
 * purchase split has already contradicted apportioning once — two receptions of
 * one 151 kg line carried 158 kg and 101 kg — so inventing the figure from a
 * ratio would be guessing at something that was measured.
 *
 * 🔑 `Naar locatie` is **optional**. The two halves may stay on the same shelf
 * and still be two lots, which is what separates a split from a relocation.
 */
export const StockSplitDialog = ({
  data,
  locations,
  open,
  onOpenChange,
}: Props) => {
  const { lot, ledger } = data;
  const [state, dispatch, isPending] = useActionState(splitStockLot, {});

  const defaults: StockSplitFormValues = {
    stockUuid: lot.uuid,
    quantity: "",
    weighedWeightKg: "",
    toLocationUuid: "",
    includeReservations: false,
  };

  const {
    control,
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StockSplitFormValues>({
    resolver: zodResolver(stockSplitSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (state.success) {
      // No argument: back to the values `useForm` was given, so the next split
      // on the same lot starts from an empty quantity rather than the last one.
      reset();
      onOpenChange(false);
    }
  }, [state, onOpenChange, reset]);

  const quantity = Number(watch("quantity"));
  const unit = lot.unit ? STOCK_UNIT_LABELS[lot.unit] : "";

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, stockUuid: lot.uuid });
    });
  });

  // `OK` stays greyed while the quantity is zero or past the ceiling, the way
  // the reference refuses to let you press a button that would fail.
  const legal =
    Number.isFinite(quantity) &&
    quantity > 0 &&
    quantity < Number(lot.quantity) &&
    quantity <= ledger.totalMovable;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Split stock</DialogTitle>
            <DialogDescription>
              Take pieces off this lot and make them a lot of their own. A split
              happens immediately — it does not become a work order.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <StockLotLedger
              ledger={ledger}
              unit={unit}
              totalLabel="Total splittable"
            />

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Internal charge</p>
                <p className="text-sm">{lot.internalCharge ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bundle</p>
                <p className="text-sm">{lot.internalBatch ?? "—"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor="split-quantity" required>
                  Quantity ({unit})
                </FormLabel>
                <Input
                  id="split-quantity"
                  inputMode="decimal"
                  {...register("quantity")}
                />
                <FormFieldError message={errors.quantity?.message} />
              </div>
              <div>
                <FormLabel htmlFor="split-weighed">Weighed weight (kg)</FormLabel>
                <Input
                  id="split-weighed"
                  inputMode="decimal"
                  {...register("weighedWeightKg")}
                />
                <FormFieldError message={errors.weighedWeightKg?.message} />
                <p className="mt-1 text-xs text-muted-foreground">
                  What the pieces coming off actually read on the scale. Leave it
                  blank if they have not been weighed.
                </p>
              </div>
            </div>

            <div>
              <FormLabel htmlFor="split-location">
                To location (optional)
              </FormLabel>
              <Controller
                control={control}
                name="toLocationUuid"
                render={({ field }) => (
                  <LocationSearchField
                    id="split-location"
                    locations={locations}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder={`Stays at ${lot.locationName ?? "the same location"}`}
                  />
                )}
              />
              <FormFieldError message={errors.toLocationUuid?.message} />
            </div>

            <Controller
              control={control}
              name="includeReservations"
              render={({ field }) => (
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  <span>
                    Include reservations
                    <span className="block text-xs text-muted-foreground">
                      Ticked, the customer’s claim travels with the pieces.
                      Unticked, it stays with what is left behind — which is
                      refused if that would leave more reserved than there is
                      metal.
                    </span>
                  </span>
                </label>
              )}
            />

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
            <Button type="submit" disabled={isPending || !legal}>
              {isPending ? "Splitting…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
