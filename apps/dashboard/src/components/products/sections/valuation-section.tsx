"use client";

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { salesUnitOptions } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { SALES_UNIT_LABELS } from "@/lib/labels";

const priceUnitOpts = enumOptions(salesUnitOptions, SALES_UNIT_LABELS);

// Prices and valuation. The average purchase price is normally derived from
// goods actually received — it is editable here because an opening balance has
// to be entered by hand before any receipt exists to derive it from.
export const ValuationSection = () => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">
        Prices and valuation
      </h2>

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
          <FormLabel htmlFor="replacementPrice">Replacement price</FormLabel>
          <Input
            id="replacementPrice"
            inputMode="decimal"
            {...register("replacementPrice")}
          />
        </div>
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
          <FormLabel htmlFor="averagePurchasePrice">
            Average purchase price
          </FormLabel>
          <Input
            id="averagePurchasePrice"
            inputMode="decimal"
            {...register("averagePurchasePrice")}
          />
        </div>
        <div>
          <FormLabel htmlFor="priceDate">Price date</FormLabel>
          <Input id="priceDate" type="date" {...register("priceDate")} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Fixed settlement price
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FormLabel htmlFor="fixedSettlementPrice">FSP</FormLabel>
            <Input
              id="fixedSettlementPrice"
              inputMode="decimal"
              {...register("fixedSettlementPrice")}
            />
          </div>
          <div>
            <FormLabel htmlFor="fspCalculationBasis">
              Calculated based on
            </FormLabel>
            <Input
              id="fspCalculationBasis"
              inputMode="decimal"
              {...register("fspCalculationBasis")}
            />
          </div>
          <div>
            <FormLabel htmlFor="valuationInternalSurcharge">
              Internal surcharge (%)
            </FormLabel>
            <Input
              id="valuationInternalSurcharge"
              inputMode="decimal"
              {...register("valuationInternalSurcharge")}
            />
          </div>
          <div>
            <FormLabel htmlFor="valuationExternalSurcharge">
              External surcharge (%)
            </FormLabel>
            <Input
              id="valuationExternalSurcharge"
              inputMode="decimal"
              {...register("valuationExternalSurcharge")}
            />
          </div>
          <div>
            <FormLabel htmlFor="valuationStartDate">Starting date</FormLabel>
            <Input
              id="valuationStartDate"
              type="date"
              {...register("valuationStartDate")}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
