"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  productOptions: SelectOption[];
};

// Products that may be supplied in place of this one. The relationship is
// directional — a heavier or higher grade bar often substitutes for a lighter
// one but not the other way round — so adding B here says nothing about B.
export const AlternativesSection = ({ productOptions }: Props) => {
  const { control, register } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "alternatives",
  });

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h2 className="text-base font-semibold">Alternatives</h2>
        <span className="text-xs text-muted-foreground">
          {fields.length} {fields.length === 1 ? "product" : "products"}
        </span>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-1 items-end gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <FormSelectField
              control={control}
              id={`alternatives.${index}.alternativeProductUuid`}
              name={`alternatives.${index}.alternativeProductUuid`}
              label="Alternative product"
              options={productOptions}
              emptyValue=""
            />
            <div>
              <FormLabel htmlFor={`alternatives.${index}.description`}>
                Description
              </FormLabel>
              <Input
                id={`alternatives.${index}.description`}
                {...register(`alternatives.${index}.description`)}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mb-1 cursor-pointer text-muted-foreground hover:text-destructive"
              aria-label={`Delete alternative ${index + 1}`}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            append({ alternativeProductUuid: "", description: "" })
          }
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          New alternative
        </button>
      </div>
    </section>
  );
};
