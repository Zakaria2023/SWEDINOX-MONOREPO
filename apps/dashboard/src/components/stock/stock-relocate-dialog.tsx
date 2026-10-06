"use client";

import {
  LocationTreeRow,
  relocateStockLot,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
import {
  StockRelocateFormValues,
  stockRelocateSchema,
} from "@/app/(dashboard)/stock/validation";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
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
import { LocationSearchField } from "@/components/stock/location-search-field";
import { StockLotLedger } from "@/components/stock/stock-lot-ledger";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { relocationReasons } from "@/lib/enums";
import { todayDateString } from "@/lib/helpers";
import { RELOCATION_REASON_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
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
 * `Verplaatsen…` — the reference's `Aanmaken verplaatsopdracht`.
 *
 * 🔑 **It creates an order, not a movement.** The title says *create relocation
 * order*, and the dialog carries an execution date. Relocation is planned work
 * for the warehouse floor — which is exactly why `Geplande verplaatsingen`
 * subtracts in the ledger above: raising the order commits the metal, and the
 * next dialog opened has to be able to see that.
 *
 * So nothing here moves anything. The lot moves when the floor reports the work
 * order line completed.
 *
 * ⚠️ **This is not `Overboeken`.** That dialog has a `Naar Artikel` field and
 * moves a lot to another *article*; this one moves it to another *location*.
 * They were one concept in our build and the reference treats them as two.
 */
export const StockRelocateDialog = ({
  data,
  locations,
  open,
  onOpenChange,
}: Props) => {
  const { lot, ledger } = data;
  const [state, dispatch, isPending] = useActionState(relocateStockLot, {});

  const {
    control,
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StockRelocateFormValues>({
    resolver: zodResolver(stockRelocateSchema),
    defaultValues: {
      stockUuid: lot.uuid,
      quantity: "",
      toLocationUuid: "",
      reason: "to_another_location",
      // The reference defaults the execution date to today.
      executeOn: todayDateString(),
      includeReservations: false,
    },
  });

  useEffect(() => {
    if (state.success) {
      reset();
      onOpenChange(false);
    }
  }, [state, onOpenChange, reset]);

  const quantity = Number(watch("quantity"));
  const toLocationUuid = watch("toLocationUuid");
  const unit = lot.unit ? STOCK_UNIT_LABELS[lot.unit] : "";

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, stockUuid: lot.uuid });
    });
  });

  // `OK en gereed` stays greyed while the quantity is 0 in the reference.
  const legal =
    Number.isFinite(quantity) &&
    quantity > 0 &&
    quantity <= ledger.totalMovable &&
    Boolean(toLocationUuid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create relocation order</DialogTitle>
            <DialogDescription>
              Plans a move to another location. The metal shifts when the
              warehouse reports the work order — not now.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <StockLotLedger
              ledger={ledger}
              unit={unit}
              totalLabel="Total movable"
            />

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Internal charge</p>
                <p className="text-sm">{lot.internalCharge ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">From location</p>
                <p className="text-sm">{lot.locationName ?? "—"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor="relocate-quantity" required>
                  Quantity ({unit})
                </FormLabel>
                <Input
                  id="relocate-quantity"
                  inputMode="decimal"
                  {...register("quantity")}
                />
                <FormFieldError message={errors.quantity?.message} />
              </div>
              <div>
                <FormLabel htmlFor="relocate-execute-on" required>
                  Execution date
                </FormLabel>
                <Controller
                  control={control}
                  name="executeOn"
                  render={({ field }) => (
                    <DatePicker
                      id="relocate-execute-on"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FormFieldError message={errors.executeOn?.message} />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="relocate-location" required>
                To location
              </FormLabel>
              <Controller
                control={control}
                name="toLocationUuid"
                render={({ field }) => (
                  <LocationSearchField
                    id="relocate-location"
                    locations={locations}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.toLocationUuid)}
                  />
                )}
              />
              <FormFieldError message={errors.toLocationUuid?.message} />
            </div>

            <div>
              <FormLabel htmlFor="relocate-reason" required>
                Reason
              </FormLabel>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <Select
                    id="relocate-reason"
                    value={field.value}
                    options={relocationReasons.map((value) => ({
                      value,
                      label: RELOCATION_REASON_LABELS[value],
                    }))}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <FormFieldError message={errors.reason?.message} />
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
                      Reserved metal is movable either way — a reservation binds
                      the lot, not the shelf.
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
              {isPending ? "Raising…" : "OK and ready"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
