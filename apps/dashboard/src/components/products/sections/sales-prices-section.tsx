"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { salesUnitOptions } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { SALES_UNIT_LABELS } from "@/lib/labels";

const priceUnitOpts = enumOptions(salesUnitOptions, SALES_UNIT_LABELS);

// What the article is sold for. There is nothing to enter about what it costs:
// a purchase price is whatever a supplier billed, so it is entered once on
// their invoice and read back from there wherever a cost figure is needed.
export const SalesPricesSection = () => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">Sales prices</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormSelectField
          control={control}
          id="priceUnit"
          name="priceUnit"
          label="Price unit"
          options={priceUnitOpts}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="markup">Markup (%)</FormLabel>
          <Input id="markup" inputMode="decimal" {...register("markup")} />
        </div>
        <div>
          <FormLabel htmlFor="basePrice">Base price</FormLabel>
          <Input id="basePrice" inputMode="decimal" {...register("basePrice")} />
        </div>
        <div>
          <FormLabel htmlFor="fixedSalesPrice">Fixed sales price</FormLabel>
          <Input
            id="fixedSalesPrice"
            inputMode="decimal"
            {...register("fixedSalesPrice")}
          />
        </div>
        <div>
          <FormLabel htmlFor="priceDate">Price date</FormLabel>
          <Controller
            name="priceDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="priceDate"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
};
