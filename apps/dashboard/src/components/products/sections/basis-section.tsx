"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { SelectOption } from "@/components/shadcn/select";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  ceStandards,
  decimalPlacesOptions,
  featuresQualities,
  processedOptions,
  productDimensionShapes,
  productQualityStandards,
} from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import {
  CE_STANDARD_LABELS,
  FEATURES_QUALITY_LABELS,
  PRODUCT_DIMENSION_SHAPE_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
  PROCESSED_OPTION_LABELS,
} from "@/lib/labels";

type Props = {
  productOptions: SelectOption[];
};

const dimensionShapeOptions = enumOptions(
  productDimensionShapes,
  PRODUCT_DIMENSION_SHAPE_LABELS,
);
const featuresQualityOptions = enumOptions(
  featuresQualities,
  FEATURES_QUALITY_LABELS,
);
const standardsQualityOptions = enumOptions(
  productQualityStandards,
  PRODUCT_QUALITY_STANDARD_LABELS,
);
const ceOptions = enumOptions(ceStandards, CE_STANDARD_LABELS);
const processedOptionOptions = enumOptions(
  processedOptions,
  PROCESSED_OPTION_LABELS,
);
const decimalPlacesOpts = decimalPlacesOptions.map((value) => ({
  value,
  label: value,
}));

export const BasisSection = ({ productOptions }: Props) => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">Basis</h2>

      {/* Dimensions — which of these carry meaning depends on the shape. */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Dimensions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormSelectField
            control={control}
            id="dimensionShape"
            name="dimensionShape"
            label="Shape"
            options={dimensionShapeOptions}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="length">Length (mm)</FormLabel>
            <Input id="length" inputMode="decimal" {...register("length")} />
          </div>
          <div>
            <FormLabel htmlFor="widthDiameter">Width / Ø (mm)</FormLabel>
            <Input
              id="widthDiameter"
              inputMode="decimal"
              {...register("widthDiameter")}
            />
          </div>
          <div>
            <FormLabel htmlFor="thickness">Thickness (mm)</FormLabel>
            <Input
              id="thickness"
              inputMode="decimal"
              {...register("thickness")}
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Features</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FormLabel htmlFor="tradeLength">Trade length (mm)</FormLabel>
            <Input
              id="tradeLength"
              inputMode="decimal"
              {...register("tradeLength")}
            />
          </div>
          <div>
            <FormLabel htmlFor="overlength">Overlength (mm)</FormLabel>
            <Input
              id="overlength"
              inputMode="decimal"
              {...register("overlength")}
            />
          </div>
          <div>
            <FormLabel htmlFor="weightPerM1">Weight (KG/M1)</FormLabel>
            <Input
              id="weightPerM1"
              inputMode="decimal"
              {...register("weightPerM1")}
            />
          </div>
          <div>
            <FormLabel htmlFor="paintSurfacePerM1">
              Paint surface (M2/M1)
            </FormLabel>
            <Input
              id="paintSurfacePerM1"
              inputMode="decimal"
              {...register("paintSurfacePerM1")}
            />
          </div>
          <FormSelectField
            control={control}
            id="featuresQuality"
            name="featuresQuality"
            label="Quality"
            options={featuresQualityOptions}
            emptyValue=""
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Controller
              control={control}
              name="tradeLengthFixed"
              render={({ field }) => (
                <FormCheckboxCard
                  label="Fixed dimensions"
                  checked={field.value}
                  active={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* View features */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          View features
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            control={control}
            id="decimalPlaces"
            name="decimalPlaces"
            label="Number of decimal places, weight"
            options={decimalPlacesOpts}
          />
          <div className="flex items-end">
            <Controller
              control={control}
              name="printDimensions"
              render={({ field }) => (
                <FormCheckboxCard
                  className="w-full"
                  label="Print dimensions"
                  checked={field.value}
                  active={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Weights */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Weights</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FormLabel htmlFor="densityKgDm3">Density (kg/dm³)</FormLabel>
            <Input
              id="densityKgDm3"
              inputMode="decimal"
              placeholder="from the grade"
              {...register("densityKgDm3")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Overrides the grade&rsquo;s density when set. Every weight below
              is derived from it.
            </p>
          </div>
          <div>
            <FormLabel htmlFor="weightTheoretical">Theoretically</FormLabel>
            <Input
              id="weightTheoretical"
              inputMode="decimal"
              {...register("weightTheoretical")}
            />
          </div>
          <div>
            <FormLabel htmlFor="weightTrade">Trade</FormLabel>
            <Input
              id="weightTrade"
              inputMode="decimal"
              {...register("weightTrade")}
            />
          </div>
          <div>
            <FormLabel htmlFor="weightGerman">German</FormLabel>
            <Input
              id="weightGerman"
              inputMode="decimal"
              {...register("weightGerman")}
            />
          </div>
        </div>
      </div>

      {/* Standards + Processed */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormSelectField
          control={control}
          id="standardsQuality"
          name="standardsQuality"
          label="Standard — quality"
          options={standardsQualityOptions}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="tolerance"
          name="tolerance"
          label="Standard — tolerance"
          options={standardsQualityOptions}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="ce"
          name="ce"
          label="CE"
          options={ceOptions}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="processedOption"
          name="processedOption"
          label="Processed — option"
          options={processedOptionOptions}
          emptyValue=""
        />
        <FormSelectField
          control={control}
          id="sourceProductUuid"
          name="sourceProductUuid"
          label="Processed — source product"
          options={productOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="industryNumber">Industry number</FormLabel>
          <Input id="industryNumber" {...register("industryNumber")} />
        </div>
      </div>
    </section>
  );
};
