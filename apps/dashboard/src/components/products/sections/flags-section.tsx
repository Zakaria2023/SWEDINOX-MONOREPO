"use client";

import { useFormContext, Controller } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Checkbox } from "@/components/shadcn/checkbox";

export const FlagsSection = () => {
  const { control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Flags</h2>
      <div className="flex flex-col gap-3">
        <Controller
          control={control}
          name="stockProduct"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Stock Product
            </label>
          )}
        />
        <Controller
          control={control}
          name="standardProduct"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Standard Product
            </label>
          )}
        />
      </div>
    </section>
  );
};
