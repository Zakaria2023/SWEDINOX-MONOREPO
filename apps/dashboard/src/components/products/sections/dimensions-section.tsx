"use client";

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";

export const DimensionsSection = () => {
  const { register } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Dimensions</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <FormLabel htmlFor="length">Length</FormLabel>
          <Input id="length" type="number" step="0.01" {...register("length")} />
        </div>
        <div>
          <FormLabel htmlFor="widthDiameter">Width / Diameter</FormLabel>
          <Input id="widthDiameter" type="number" step="0.01" {...register("widthDiameter")} />
        </div>
        <div>
          <FormLabel htmlFor="thickness">Thickness</FormLabel>
          <Input id="thickness" type="number" step="0.01" {...register("thickness")} />
        </div>
      </div>
    </section>
  );
};
