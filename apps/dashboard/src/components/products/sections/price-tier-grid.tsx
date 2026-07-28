"use client";

import { Plus, X } from "lucide-react";
import { Control, FieldPath, useFieldArray } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { useFormContext } from "react-hook-form";

type Props = {
  control: Control<ProductFormValues>;
  /** Field-array path of the tier list, e.g. `priceStructures.0.groupDiscountTiers`. */
  name: FieldPath<ProductFormValues>;
  fromLabel: string;
  valueLabel: string;
  disabled?: boolean;
};

// One tier table inside a price structure: "from this threshold, this value
// applies". Rendered small and dense because a structure holds five of them
// side by side.
export const PriceTierGrid = ({
  control,
  name,
  fromLabel,
  valueLabel,
  disabled = false,
}: Props) => {
  const { register } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as "priceStructures.0.groupDiscountTiers",
  });

  if (disabled) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        Not applied
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
        <span>{fromLabel}</span>
        <span>{valueLabel}</span>
        <span className="w-6" />
      </div>

      {fields.map((tier, index) => (
        <div key={tier.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            aria-label={`${fromLabel} ${index + 1}`}
            inputMode="decimal"
            className="h-8"
            {...register(
              `${name}.${index}.from` as "priceStructures.0.groupDiscountTiers.0.from",
            )}
          />
          <Input
            aria-label={`${valueLabel} ${index + 1}`}
            inputMode="decimal"
            className="h-8"
            {...register(
              `${name}.${index}.value` as "priceStructures.0.groupDiscountTiers.0.value",
            )}
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="w-6 cursor-pointer text-muted-foreground hover:text-destructive"
            aria-label={`Delete tier ${index + 1}`}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ from: "0", value: "0.00" })}
        className="inline-flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="size-3" />
        Add tier
      </button>
    </div>
  );
};
