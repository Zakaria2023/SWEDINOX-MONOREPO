"use client";

import { Plus, X } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  EMPTY_PRICE_STRUCTURE,
  ProductFormValues,
} from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { priceTierBases, purchasingUnits } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { PRICE_TIER_BASE_LABELS, PURCHASING_UNIT_LABELS } from "@/lib/labels";
import { PriceTierGrid } from "./price-tier-grid";

const priceUnitOpts = enumOptions(purchasingUnits, PURCHASING_UNIT_LABELS);
const tierBasisOpts = enumOptions(priceTierBases, PRICE_TIER_BASE_LABELS);

// The material price for the article over a validity window. A price change
// opens a new structure with its own starting date rather than editing the
// current one, so the price that applied to a historic order can still be
// reconstructed.
export const PriceStructuresSection = () => {
  const { control, register, watch } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceStructures",
  });

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h2 className="text-base font-semibold">Price structure — material</h2>
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
                Valid from {watch(`priceStructures.${index}.validFrom`) || "—"}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="cursor-pointer text-muted-foreground hover:text-destructive"
                aria-label={`Delete price structure ${index + 1}`}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FormLabel htmlFor={`priceStructures.${index}.validFrom`}>
                  Valid from
                </FormLabel>
                <Input
                  id={`priceStructures.${index}.validFrom`}
                  type="date"
                  {...register(`priceStructures.${index}.validFrom`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`priceStructures.${index}.validUntil`}>
                  Valid until
                </FormLabel>
                <Input
                  id={`priceStructures.${index}.validUntil`}
                  type="date"
                  {...register(`priceStructures.${index}.validUntil`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`priceStructures.${index}.priceUnit`}
                name={`priceStructures.${index}.priceUnit`}
                label="Price unit"
                options={priceUnitOpts}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`priceStructures.${index}.basePrice`}>
                  Base price
                </FormLabel>
                <Input
                  id={`priceStructures.${index}.basePrice`}
                  inputMode="decimal"
                  {...register(`priceStructures.${index}.basePrice`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`priceStructures.${index}.markup`}>
                  Markup
                </FormLabel>
                <Input
                  id={`priceStructures.${index}.markup`}
                  inputMode="decimal"
                  {...register(`priceStructures.${index}.markup`)}
                />
              </div>
              <div>
                <FormLabel htmlFor={`priceStructures.${index}.scrap`}>
                  Scrap
                </FormLabel>
                <Input
                  id={`priceStructures.${index}.scrap`}
                  inputMode="decimal"
                  {...register(`priceStructures.${index}.scrap`)}
                />
              </div>
            </div>

            {/* The five tier grids. Each is switched on independently: "no
                quantity surcharge" and "a quantity surcharge of zero" say
                different things about how the article is sold. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-border p-3">
                <Controller
                  control={control}
                  name={`priceStructures.${index}.quantitySurchargeEnabled`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      label="Quantity surcharge"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <FormSelectField
                  control={control}
                  id={`priceStructures.${index}.quantitySurchargeBasis`}
                  name={`priceStructures.${index}.quantitySurchargeBasis`}
                  label="Surcharge per"
                  options={tierBasisOpts}
                  emptyValue=""
                  disabled={
                    !watch(`priceStructures.${index}.quantitySurchargeEnabled`)
                  }
                />
                <PriceTierGrid
                  control={control}
                  name={`priceStructures.${index}.quantitySurchargeTiers`}
                  fromLabel="From KG"
                  valueLabel="Per unit"
                  disabled={
                    !watch(`priceStructures.${index}.quantitySurchargeEnabled`)
                  }
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <Controller
                  control={control}
                  name={`priceStructures.${index}.groupDiscountEnabled`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      label="Group discount"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <FormSelectField
                  control={control}
                  id={`priceStructures.${index}.groupDiscountBasis`}
                  name={`priceStructures.${index}.groupDiscountBasis`}
                  label="Discount based on"
                  options={tierBasisOpts}
                  emptyValue=""
                  disabled={
                    !watch(`priceStructures.${index}.groupDiscountEnabled`)
                  }
                />
                <PriceTierGrid
                  control={control}
                  name={`priceStructures.${index}.groupDiscountTiers`}
                  fromLabel="From KG"
                  valueLabel="Per unit"
                  disabled={
                    !watch(`priceStructures.${index}.groupDiscountEnabled`)
                  }
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <Controller
                  control={control}
                  name={`priceStructures.${index}.lengthSurchargeEnabled`}
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
                  name={`priceStructures.${index}.lengthSurchargeTiers`}
                  fromLabel="From MM"
                  valueLabel="Per unit"
                  disabled={
                    !watch(`priceStructures.${index}.lengthSurchargeEnabled`)
                  }
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <Controller
                  control={control}
                  name={`priceStructures.${index}.qualitySurchargeEnabled`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      label="Quality surcharge"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <PriceTierGrid
                  control={control}
                  name={`priceStructures.${index}.qualitySurchargeTiers`}
                  fromLabel="Quality"
                  valueLabel="Per unit"
                  disabled={
                    !watch(`priceStructures.${index}.qualitySurchargeEnabled`)
                  }
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <Controller
                  control={control}
                  name={`priceStructures.${index}.lineDiscountEnabled`}
                  render={({ field }) => (
                    <FormCheckboxCard
                      label="Line discount"
                      checked={field.value}
                      active={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <PriceTierGrid
                  control={control}
                  name={`priceStructures.${index}.lineDiscountTiers`}
                  fromLabel="From KG"
                  valueLabel="Per unit"
                  disabled={
                    !watch(`priceStructures.${index}.lineDiscountEnabled`)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append(EMPTY_PRICE_STRUCTURE)}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          New price structure
        </button>
      </div>
    </section>
  );
};
