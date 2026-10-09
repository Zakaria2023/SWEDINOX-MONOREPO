"use client";

import {
  correctStockLot,
  SawOrderRow,
  simulateStockCorrection,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
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
import { Textarea } from "@/components/shadcn/textarea";
import { StockCorrectionSimulationPane } from "@/components/stock/stock-correction-simulation";
import { StockLotWorkSummary } from "@/components/stock/stock-lot-ledger";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import {
  featuresQualities,
  stockCategories,
  stockCorrectionReasons,
} from "@/lib/enums";
import {
  FEATURES_QUALITY_LABELS,
  STOCK_CATEGORY_LABELS,
  STOCK_CORRECTION_REASON_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, DefaultValues, useForm } from "react-hook-form";

type Props = {
  data: StockLotDialogData;
  sawOrders: SawOrderRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Correctie…` — the reference's `Corrigeren voorraad`.
 *
 * Captured 5-10-2026, and what we had built was the right idea with the wrong
 * halves. Two things changed:
 *
 * 🔴 **The split between the two tickboxes was backwards.** We put category,
 * quality and the three dimensions under *characteristics*. The reference puts
 * them under **quantity**, beside `Nieuwe hoeveelheid`, and leaves exactly one
 * field under characteristics: the stock remark. So our dialog greyed out the
 * grade when somebody only wanted to fix the count.
 *
 * 🔴 **There are four weights, not one.** `Gewicht`, `Gewogen gewicht`,
 * `Brutogewicht` and `Nettogewicht`, and on the captured lot all four disagreed
 * — 1 766,25 / 1 754 / 1 798 / 1 754. They are not derivable from each other.
 *
 * Two things stay as they were, both deliberate:
 *
 * - **`Reden` is mandatory.** The reference leaves `OK` greyed until it is set.
 * - **There is no valuation field**, because the reference has none either. A
 *   correction cannot repair a wrongly valued lot, and offering a box that
 *   pretended it could would hide that.
 *
 * 🔑 New: **`Zaagopdracht`** — a correction can be blamed on the saw order that
 * caused the loss, which is the missing link between a correction and the cut
 * that ate the material.
 */
export const StockCorrectionDialog = ({
  data,
  sawOrders,
  open,
  onOpenChange,
}: Props) => {
  const { lot, ledger, workOrderQuantities } = data;
  const [state, dispatch, isPending] = useActionState(correctStockLot, {});
  // `Simuleer` — the same correction, run and rolled back.
  const [simulation, simulate, isSimulating] = useActionState(
    simulateStockCorrection,
    {},
  );

  const defaults: DefaultValues<StockCorrectionFormValues> = {
    stockUuid: lot.uuid,
    // Blank, as the reference opens it (233) — `OK` stays greyed until a
    // `Reden` is chosen.
    reason: undefined,
    description: "",
    sawOrderUuid: "",
    correctQuantity: false,
    quantity: lot.quantity,
    quantityKg: lot.quantityKg ?? "",
    quality: lot.quality ?? "",
    stockCategory: lot.stockCategory ?? "",
    lengthMm: lot.lengthMm === null ? "" : String(lot.lengthMm),
    widthMm: lot.widthMm === null ? "" : String(lot.widthMm),
    thicknessMm: lot.thicknessMm ?? "",
    weighedWeightKg: lot.weighedWeightKg ?? "",
    grossWeightKg: lot.grossWeightKg ?? "",
    netWeightKg: lot.netWeightKg ?? "",
    correctCharacteristics: false,
    remark: lot.remark ?? "",
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
  const reason = watch("reason");

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, stockUuid: lot.uuid });
    });
  });

  const onSimulate = handleSubmit((values) => {
    startTransition(() => {
      simulate({ ...values, stockUuid: lot.uuid });
    });
  });

  const unit = lot.unit ? STOCK_UNIT_LABELS[lot.unit] : "";
  const busy = isPending || isSimulating;

  // `Kwaliteit` is a lookup in the reference (237/238) — `Kwaliteitscode` and
  // `Omschrijving`, `304L` against `EN 1.4307`. A lot keyed before the list
  // existed may hold a code outside it, so that one is offered too rather than
  // silently blanked.
  const qualityOptions = [
    ...(lot.quality &&
    !(featuresQualities as readonly string[]).includes(lot.quality)
      ? [{ value: lot.quality, label: lot.quality, description: "" }]
      : []),
    ...featuresQualities.map((value) => ({
      value,
      label: value,
      description: FEATURES_QUALITY_LABELS[value],
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Correct stock</DialogTitle>
            <DialogDescription>
              Correct what this metal is and how much of it there is, the note
              on it, or both. Every change is written to the movement history
              with what it was before.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <StockLotWorkSummary
              workOrderQuantities={workOrderQuantities}
              ledger={ledger}
              unit={unit}
            />

            {/* The lot's identity, shown greyed rather than hidden — the
                reference's dialogs always say which lot they are about. */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Internal charge</p>
                <p className="text-sm">{lot.internalCharge ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bundle</p>
                <p className="text-sm">{lot.internalBatch ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Charge (mill)</p>
                <p className="text-sm">{lot.charge ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm">{lot.locationName ?? "—"}</p>
              </div>
            </div>

            {/* ── ☑ Voorraad hoeveelheid correctie ──────────────────────── */}
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
                    Correct the quantity and what the metal is
                  </label>
                )}
              />
              <FormFieldError message={errors.correctQuantity?.message} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="mb-1 block text-sm font-medium text-muted-foreground">
                    Current quantity
                  </p>
                  <Input value={`${lot.quantity} ${unit}`} readOnly disabled />
                </div>
                <div>
                  <FormLabel htmlFor="correction-quantity">
                    New quantity
                  </FormLabel>
                  <Input
                    id="correction-quantity"
                    inputMode="decimal"
                    disabled={!correctQuantity}
                    {...register("quantity")}
                  />
                  <FormFieldError message={errors.quantity?.message} />
                </div>
              </div>

              {/* `Reden` and `Zaagopdracht` sit inside the `Corrigeren voorraad`
                  box in the reference (233), under the new quantity. `Reden`
                  stays live even with the box unticked: a remark-only
                  correction still needs its reason, `Add / adjust stock
                  remark`. */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FormLabel htmlFor="correction-reason" required>
                    Reason
                  </FormLabel>
                  <Controller
                    control={control}
                    name="reason"
                    render={({ field }) => (
                      <Select
                        id="correction-reason"
                        value={field.value ?? ""}
                        placeholder="-empty-"
                        invalid={Boolean(errors.reason)}
                        options={stockCorrectionReasons.map((value) => ({
                          value,
                          label: STOCK_CORRECTION_REASON_LABELS[value],
                        }))}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  <FormFieldError message={errors.reason?.message} />
                </div>

                <div>
                  {/* `Zaagopdracht` — always enabled in the reference (236),
                      a lookup grid `Opdracht` / `Ordernr` that opens on a
                      `-leeg-` row even when the lot never saw a saw. */}
                  <FormLabel htmlFor="correction-saw-order">
                    Saw order (optional)
                  </FormLabel>
                  <Controller
                    control={control}
                    name="sawOrderUuid"
                    render={({ field }) => (
                      <Select
                        id="correction-saw-order"
                        value={field.value ?? ""}
                        placeholder="-empty-"
                        columnHeaders={{ left: "Order", right: "Order no." }}
                        options={[
                          { value: "", label: "-empty-", description: "" },
                          ...sawOrders.map((row) => ({
                            value: row.lineUuid,
                            label: String(row.workOrderNumber),
                            description: row.orderNumber
                              ? String(row.orderNumber)
                              : "—",
                          })),
                        ]}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Blames the loss on the cut that caused it.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="correction-category">Category</FormLabel>
                  <Controller
                    control={control}
                    name="stockCategory"
                    render={({ field }) => (
                      <Select
                        id="correction-category"
                        value={field.value ?? ""}
                        disabled={!correctQuantity}
                        placeholder="Not set"
                        options={stockCategories.map((value) => ({
                          value,
                          label: STOCK_CATEGORY_LABELS[value],
                        }))}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  <FormFieldError message={errors.stockCategory?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-quality">Quality</FormLabel>
                  <Controller
                    control={control}
                    name="quality"
                    render={({ field }) => (
                      <Select
                        id="correction-quality"
                        value={field.value ?? ""}
                        disabled={!correctQuantity}
                        placeholder="Not set"
                        columnHeaders={{ left: "Code", right: "Description" }}
                        options={qualityOptions}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  <FormFieldError message={errors.quality?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-length">Length (mm)</FormLabel>
                  <Input
                    id="correction-length"
                    inputMode="numeric"
                    disabled={!correctQuantity}
                    {...register("lengthMm")}
                  />
                  <FormFieldError message={errors.lengthMm?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-width">Width (mm)</FormLabel>
                  <Input
                    id="correction-width"
                    inputMode="numeric"
                    disabled={!correctQuantity}
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
                    disabled={!correctQuantity}
                    {...register("thicknessMm")}
                  />
                  <FormFieldError message={errors.thicknessMm?.message} />
                </div>
              </div>

              {/* 🔑 All four weights. They disagree on real lots and none of
                  them can be derived from another. */}
              <div className="grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4">
                <div>
                  <FormLabel htmlFor="correction-weight">
                    Theoretical (kg)
                  </FormLabel>
                  <Input
                    id="correction-weight"
                    inputMode="decimal"
                    disabled={!correctQuantity}
                    {...register("quantityKg")}
                  />
                  <FormFieldError message={errors.quantityKg?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-weighed">
                    Weighed (kg)
                  </FormLabel>
                  <Input
                    id="correction-weighed"
                    inputMode="decimal"
                    disabled={!correctQuantity}
                    {...register("weighedWeightKg")}
                  />
                  <FormFieldError message={errors.weighedWeightKg?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-gross">Gross (kg)</FormLabel>
                  <Input
                    id="correction-gross"
                    inputMode="decimal"
                    disabled={!correctQuantity}
                    {...register("grossWeightKg")}
                  />
                  <FormFieldError message={errors.grossWeightKg?.message} />
                </div>
                <div>
                  <FormLabel htmlFor="correction-net">Net (kg)</FormLabel>
                  <Input
                    id="correction-net"
                    inputMode="decimal"
                    disabled={!correctQuantity}
                    {...register("netWeightKg")}
                  />
                  <FormFieldError message={errors.netWeightKg?.message} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Gross − tare = net = weighed, and the weighed weight is what the
                supplier invoices on. The lot keeps its own valuation price, so
                its value follows the quantity — a correction cannot revalue
                metal.
              </p>

              {/* `Vooraadmutatie omschrijving` — a memo, after the weights. */}
              <div>
                <FormLabel htmlFor="correction-description">
                  Movement description
                </FormLabel>
                <Textarea
                  id="correction-description"
                  rows={3}
                  {...register("description")}
                />
                <FormFieldError message={errors.description?.message} />
              </div>
            </div>

            {/* ── ☐ Voorraad kenmerk correctie ──────────────────────────── */}
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
                    Correct the stock remark
                  </label>
                )}
              />
              <div>
                <FormLabel htmlFor="correction-remark">Stock remark</FormLabel>
                <Textarea
                  id="correction-remark"
                  rows={3}
                  disabled={!correctCharacteristics}
                  {...register("remark")}
                />
                <FormFieldError message={errors.remark?.message} />
              </div>
              {reason !== "stock_remark" && correctCharacteristics ? (
                <p className="text-xs text-muted-foreground">
                  Editing only the note? “Add / adjust stock remark” is the
                  reason for it, and it is the one reason that cannot move metal.
                </p>
              ) : null}
            </div>

            <StockCorrectionSimulationPane simulation={simulation} unit={unit} />
            <FormError>{simulation.error}</FormError>
            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(defaults)}
              disabled={busy}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSimulate}
              disabled={busy || (!correctQuantity && !correctCharacteristics)}
            >
              {isSimulating ? "Simulating…" : "Simulate"}
            </Button>
            {/* Greyed until something is actually being corrected and a
                `Reden` is chosen, the way the reference greys `OK` until the
                form is legal. */}
            <Button
              type="submit"
              disabled={
                busy ||
                !reason ||
                (!correctQuantity && !correctCharacteristics)
              }
            >
              {isPending ? "Correcting…" : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
