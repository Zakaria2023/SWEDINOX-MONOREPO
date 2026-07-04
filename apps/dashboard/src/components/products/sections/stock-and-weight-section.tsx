"use client";

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { salesUnitOptions, SalesUnit } from "@/lib/enums";
import { SALES_UNIT_LABELS } from "@/lib/labels";

const emptyOption = { value: "", label: "— None —" };

const unitOptions = [
  emptyOption,
  ...salesUnitOptions.map((u) => ({
    value: u,
    label: SALES_UNIT_LABELS[u as SalesUnit] ?? u,
  })),
];

export const StockAndWeightSection = () => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Stock & Weight</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormLabel htmlFor="technicalStock">Technical Stock</FormLabel>
          <Input id="technicalStock" type="number" step="0.001" {...register("technicalStock")} />
        </div>
        <FormSelectField
          control={control}
          id="stockUnit"
          name="stockUnit"
          label="Stock Unit (StkU)"
          options={unitOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="theoreticalWeight">Theoretical Weight (kg)</FormLabel>
          <Input id="theoreticalWeight" type="number" step="0.0001" {...register("theoreticalWeight")} />
        </div>
        <FormSelectField
          control={control}
          id="weightUnit"
          name="weightUnit"
          label="Weight Unit"
          options={unitOptions}
          emptyValue=""
        />
      </div>
    </section>
  );
};
