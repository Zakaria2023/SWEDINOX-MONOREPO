"use client";

import {
  LocationTreeRow,
  StockLotDialogData,
  transferStockLot,
} from "@/app/(dashboard)/stock/actions";
import {
  StockTransferFormValues,
  stockTransferSchema,
} from "@/app/(dashboard)/stock/validation";
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
import { Textarea } from "@/components/shadcn/textarea";
import { LocationSearchField } from "@/components/stock/location-search-field";
import { StockLotWorkSummary } from "@/components/stock/stock-lot-ledger";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import { transferReasons } from "@/lib/enums";
import { STOCK_UNIT_LABELS, TRANSFER_REASON_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  data: StockLotDialogData;
  locations: LocationTreeRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Overboeken…` — the reference's `Aanmaken overboekingsopdracht`.
 *
 * 🔑 **One field separates this from `Verplaatsen`: `Naar Artikel`.**
 * Relocating moves a lot to another *location*; transferring moves it to
 * another *article*, optionally re-shelving at the same time. It is
 * re-classification — deciding a lot is really a different product than it was
 * booked as, which is what happens when a receipt was keyed against the wrong
 * code.
 *
 * `Reden` has **exactly one value**, `Transfer`. A one-member enum is still an
 * enum: it is stored and the stock mutation reads it.
 *
 * 🔑 `Naar Artikel`'s `…` opens the full stock-search dialog, never a dropdown
 * — the same rule every product picker in this build follows.
 *
 * 🔑 Unlike a relocation there is **no execution date**, so a transfer takes
 * effect on save. And unlike every other internal act it **writes to the
 * ledger**, because article A holds less afterwards and article B holds more.
 */
export const StockTransferDialog = ({
  data,
  locations,
  open,
  onOpenChange,
}: Props) => {
  const { lot, ledger, workOrderQuantities } = data;
  const [state, dispatch, isPending] = useActionState(transferStockLot, {});
  const [targetLabel, setTargetLabel] = useState<string | null>(null);

  const {
    control,
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StockTransferFormValues>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      stockUuid: lot.uuid,
      quantity: "",
      toProductUuid: "",
      toLocationUuid: "",
      // Blank in the reference (240), though its list holds one value (243):
      // `OK en gereed` stays greyed until `Transfer` is picked.
      reason: undefined,
      description: "",
    },
  });

  useEffect(() => {
    if (state.success) {
      reset();
      setTargetLabel(null);
      onOpenChange(false);
    }
  }, [state, onOpenChange, reset]);

  const quantity = Number(watch("quantity"));
  const toProductUuid = watch("toProductUuid");
  const reason = watch("reason");
  const unit = lot.unit ? STOCK_UNIT_LABELS[lot.unit] : "";

  // 🔴 A reservation cannot cross an article boundary — the order line promises
  // one product and would be holding another. So the ceiling here is the
  // *unreserved* quantity, not `Total movable`, and it is the one place the
  // reference's "reserved stock is movable" finding stops applying.
  const unreserved = ledger.available;

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, stockUuid: lot.uuid });
    });
  });

  const legal =
    Number.isFinite(quantity) &&
    quantity > 0 &&
    quantity <= unreserved &&
    Boolean(toProductUuid) &&
    Boolean(reason);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create transfer order</DialogTitle>
            <DialogDescription>
              Books this metal against a different article. Use it when a lot was
              received under the wrong code, not to move it between shelves.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <StockLotWorkSummary
              workOrderQuantities={workOrderQuantities}
              ledger={ledger}
              unit={unit}
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
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">From article</p>
                <p className="text-sm">
                  {[lot.productCode, lot.productName]
                    .filter(Boolean)
                    .join(" — ") || "—"}
                </p>
              </div>
            </div>

            <div>
              <FormLabel htmlFor="transfer-quantity" required>
                Quantity ({unit})
              </FormLabel>
              <Input
                id="transfer-quantity"
                inputMode="decimal"
                {...register("quantity")}
              />
              <FormFieldError message={errors.quantity?.message} />
              {ledger.reserved > 0 ? (
                <p className="mt-1 text-xs text-amber-600">
                  {ledger.reserved} {unit} is reserved and cannot be transferred
                  — a claim cannot follow metal onto a different article. At most{" "}
                  {unreserved} {unit} can move.
                </p>
              ) : null}
            </div>

            <div>
              <FormLabel htmlFor="transfer-product" required>
                To article
              </FormLabel>
              <Controller
                control={control}
                name="toProductUuid"
                render={({ field }) => (
                  <ProductSearchField
                    id="transfer-product"
                    value={field.value}
                    initialLabel={targetLabel}
                    // The reference opens `Voorraad` on the shelf (241), with
                    // `Alleen artikelen met technische voorraad` ticked; the
                    // catalogue comes second, for an article nobody holds yet.
                    sources={["stock", "catalogue"]}
                    invalid={Boolean(errors.toProductUuid)}
                    onChange={(choice) => {
                      field.onChange(choice.productUuid);
                      setTargetLabel(
                        [choice.productCode, choice.productName]
                          .filter(Boolean)
                          .join(" — "),
                      );
                    }}
                  />
                )}
              />
              <FormFieldError message={errors.toProductUuid?.message} />
              <p className="mt-1 text-xs text-muted-foreground">
                The lot keeps its own measured dimensions and weights — this says
                the code was wrong, not that the tape measure was.
              </p>
            </div>

            <div>
              <FormLabel htmlFor="transfer-location">
                To location (optional)
              </FormLabel>
              <Controller
                control={control}
                name="toLocationUuid"
                render={({ field }) => (
                  <LocationSearchField
                    id="transfer-location"
                    locations={locations}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder={`Stays at ${lot.locationName ?? "the same location"}`}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="transfer-reason" required>
                Reason
              </FormLabel>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <Select
                    id="transfer-reason"
                    value={field.value ?? ""}
                    placeholder="-empty-"
                    invalid={Boolean(errors.reason)}
                    options={transferReasons.map((value) => ({
                      value,
                      label: TRANSFER_REASON_LABELS[value],
                    }))}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <FormFieldError message={errors.reason?.message} />
            </div>

            <div>
              <FormLabel htmlFor="transfer-description">
                Movement description
              </FormLabel>
              <Textarea
                id="transfer-description"
                rows={3}
                {...register("description")}
              />
              <FormFieldError message={errors.description?.message} />
            </div>

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
              {isPending ? "Transferring…" : "OK and ready"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
