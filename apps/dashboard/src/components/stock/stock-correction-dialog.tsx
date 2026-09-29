"use client";

import { correctStockLot, StockDetail } from "@/app/(dashboard)/stock/actions";
import {
  StockCorrectionFormValues,
  stockCorrectionSchema,
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
import { stockCorrectionReasons } from "@/lib/enums";
import { STOCK_CORRECTION_REASON_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  stock: StockDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The reference's `Correction…`, watched on 29-9-2026.
 *
 * It is two corrections in one window, each behind its own checkbox —
 * `Voorraad hoeveelheid correctie` for the metal and `Voorraad kenmerk
 * correctie` for what the metal is — and either or both may run. A reason is
 * mandatory: the reference leaves `OK` greyed until `Reden` is chosen.
 *
 * 🔴 What ours does that the reference does not: a characteristic change lands
 * in the movement ledger. Downgrading a lot `Standaard` → `2nd choice` there
 * left no trace at all, and the category decides what the metal may be sold as.
 *
 * There is deliberately **no valuation field**, because the reference has none
 * either — a correction cannot repair a wrongly valued lot, and pretending it
 * could would hide that.
 */
export const StockCorrectionDialog = ({ stock, open, onOpenChange }: Props) => {
  const [state, dispatch, isPending] = useActionState(correctStockLot, {});

  const defaults: StockCorrectionFormValues = {
    stockUuid: stock.uuid,
    reason: "stock_correction",
    description: "",
    correctQuantity: false,
    quantity: stock.quantity,
    quantityKg: stock.quantityKg ?? "",
    correctCharacteristics: false,
    stockCategory: stock.stockCategory ?? "",
    quality: stock.quality ?? "",
    lengthMm: stock.lengthMm === null ? "" : String(stock.lengthMm),
    widthMm: stock.widthMm === null ? "" : String(stock.widthMm),
    thicknessMm: stock.thicknessMm ?? "",
    remark: stock.remark ?? "",
  };

  const {
    control,
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StockCorrectionFormValues>({
    resolver: zodResolver(stockCorrectionSchema),
    defaultValues: defaults,
  });

  const correctQuantity = watch("correctQuantity");
  const correctCharacteristics = watch("correctCharacteristics");

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, stockUuid: stock.uuid });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Correct stock</DialogTitle>
            <DialogDescription>
              Correct the quantity, what the metal is, or both. Every change is
              written to the movement history with what it was before.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="correction-reason">Reason</FormLabel>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <Select
                    id="correction-reason"
                    value={field.value}
                    options={stockCorrectionReasons.map((reason) => ({
                      value: reason,
                      label: STOCK_CORRECTION_REASON_LABELS[reason],
                    }))}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <FormFieldError message={errors.reason?.message} />
            </div>

            <div>
              <FormLabel htmlFor="correction-description">
                Description
              </FormLabel>
              <Input id="correction-description" {...register("description")} />
              <FormFieldError message={errors.description?.message} />
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <Controller
                control={control}
                name="correctQuantity"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Correct the quantity
                  </label>
                )}
              />
              <FormFieldError message={errors.correctQuantity?.message} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FormLabel htmlFor="correction-quantity">Quantity</FormLabel>
                  <Input
                    id="correction-quantity"
                    inputMode="decimal"
                    disabled={!correctQuantity}
                    {...register("quantity")}
                  />
                  <FormFieldError message={errors.quantity?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-quantity-kg">
                    Weight (kg)
                  </FormLabel>
                  <Input
                    id="correction-quantity-kg"
                    inputMode="decimal"
                    disabled={!correctQuantity}
                    {...register("quantityKg")}
                  />
                  <FormFieldError message={errors.quantityKg?.message} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The lot keeps its own valuation price, so its value follows the
                quantity. A correction cannot revalue metal.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <Controller
                control={control}
                name="correctCharacteristics"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Correct the characteristics
                  </label>
                )}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="correction-category">Category</FormLabel>
                  <Input
                    id="correction-category"
                    disabled={!correctCharacteristics}
                    {...register("stockCategory")}
                  />
                  <FormFieldError message={errors.stockCategory?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-quality">Quality</FormLabel>
                  <Input
                    id="correction-quality"
                    disabled={!correctCharacteristics}
                    {...register("quality")}
                  />
                  <FormFieldError message={errors.quality?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-length">Length (mm)</FormLabel>
                  <Input
                    id="correction-length"
                    inputMode="numeric"
                    disabled={!correctCharacteristics}
                    {...register("lengthMm")}
                  />
                  <FormFieldError message={errors.lengthMm?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-width">Width (mm)</FormLabel>
                  <Input
                    id="correction-width"
                    inputMode="numeric"
                    disabled={!correctCharacteristics}
                    {...register("widthMm")}
                  />
                  <FormFieldError message={errors.widthMm?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-thickness">
                    Thickness (mm)
                  </FormLabel>
                  <Input
                    id="correction-thickness"
                    inputMode="decimal"
                    disabled={!correctCharacteristics}
                    {...register("thicknessMm")}
                  />
                  <FormFieldError message={errors.thicknessMm?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-remark">Remark</FormLabel>
                  <Input
                    id="correction-remark"
                    disabled={!correctCharacteristics}
                    {...register("remark")}
                  />
                  <FormFieldError message={errors.remark?.message} />
                </div>
              </div>
            </div>

            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(defaults)}
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
              {isPending ? "Correcting…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
