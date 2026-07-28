"use client";

import { Plus, X } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  EMPTY_SAWING_PRICE,
  ProductFormValues,
} from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { purchasingUnits } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { PURCHASING_UNIT_LABELS } from "@/lib/labels";
import { PriceTierGrid } from "./price-tier-grid";

const priceUnitOpts = enumOptions(purchasingUnits, PURCHASING_UNIT_LABELS);

// What cutting this article costs. Mitre cuts carry a surcharge because they
// take longer and waste more material, and an uneven angle costs more again
// than a square cut or a matched pair.
export const SawingPricesSection = () => {
  const { control, register, watch } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "sawingPrices",
  });

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h2 className="text-base font-semibold">Price structure — sawing</h2>
        <span className="text-xs text-muted-foreground">
          {fields.length} {fields.length === 1 ? "structure" : "structures"}
        </span>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="space-y-4 rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Valid from {watch(`sawingPrices.${index}.validFrom`) || "—"}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="cursor-pointer text-muted-foreground hover:text-destructive"
                aria-label={`Delete sawing price ${index + 1}`}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FormLabel htmlFor={`sawingPrices.${index}.validFrom`}>
                  Valid from
                </FormLabel>
                <Input
                  id={`sawingPrices.${index}.validFrom`}
                  type="date"
                  {...register(`sawingPrices.${index}.validFrom`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`sawingPrices.${index}.validUntil`}>
                  Valid until
                </FormLabel>
                <Input
                  id={`sawingPrices.${index}.validUntil`}
                  type="date"
                  {...register(`sawingPrices.${index}.validUntil`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`sawingPrices.${index}.priceUnit`}
                name={`sawingPrices.${index}.priceUnit`}
                label="Price unit"
                options={priceUnitOpts}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`sawingPrices.${index}.basePrice`}>
                  Base price
                </FormLabel>
                <Input
                  id={`sawingPrices.${index}.basePrice`}
                  inputMode="decimal"
                  {...register(`sawingPrices.${index}.basePrice`)}
                />
              </div>
              <div>
                <FormLabel
                  htmlFor={`sawingPrices.${index}.mitreSurchargeEvenPct`}
                >
                  Mitre surcharge % — 1 corner or 2 equal
                </FormLabel>
                <Input
                  id={`sawingPrices.${index}.mitreSurchargeEvenPct`}
                  inputMode="decimal"
                  {...register(`sawingPrices.${index}.mitreSurchargeEvenPct`)}
                />
              </div>
              <div>
                <FormLabel
                  htmlFor={`sawingPrices.${index}.mitreSurchargeUnevenPct`}
                >
                  Mitre surcharge % — uneven angles
                </FormLabel>
                <Input
                  id={`sawingPrices.${index}.mitreSurchargeUnevenPct`}
                  inputMode="decimal"
                  {...register(`sawingPrices.${index}.mitreSurchargeUnevenPct`)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-border p-3">
                <Controller
                  control={control}
                  name={`sawingPrices.${index}.quantityDiscountEnabled`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      label="Quantity discount"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <PriceTierGrid
                  control={control}
                  name={`sawingPrices.${index}.quantityDiscountTiers`}
                  fromLabel="From"
                  valueLabel="Value"
                  disabled={
                    !watch(`sawingPrices.${index}.quantityDiscountEnabled`)
                  }
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <Controller
                  control={control}
                  name={`sawingPrices.${index}.lengthSurchargeEnabled`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      label="Length surcharge"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <PriceTierGrid
                  control={control}
                  name={`sawingPrices.${index}.lengthSurchargeTiers`}
                  fromLabel="From MM"
                  valueLabel="Value"
                  disabled={
                    !watch(`sawingPrices.${index}.lengthSurchargeEnabled`)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append(EMPTY_SAWING_PRICE)}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          New sawing price structure
        </button>
      </div>
    </section>
  );
};
