"use client";

import { useFormContext } from "react-hook-form";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  ceStandards,
  decimalPlacesOptions,
  featuresQualities,
  processedOptions,
  productQualityStandards,
} from "@/lib/enums";
import {
  CE_STANDARD_LABELS,
  COMMON_TEXT,
  FEATURES_QUALITY_LABELS,
  PROCESSED_OPTION_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
} from "@/lib/labels";

const emptyOption = { value: "", label: COMMON_TEXT.emptyOption };

const makeEnumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => [emptyOption, ...values.map((v) => ({ value: v, label: labels[v] }))];

const processedOptionOptions = makeEnumOptions(
  processedOptions,
  PROCESSED_OPTION_LABELS,
);
const ceOptions = makeEnumOptions(ceStandards, CE_STANDARD_LABELS);
const standardsQualityOptions = makeEnumOptions(
  productQualityStandards,
  PRODUCT_QUALITY_STANDARD_LABELS,
);
const featuresQualityOptions = makeEnumOptions(
  featuresQualities,
  FEATURES_QUALITY_LABELS,
);
const decimalPlacesOpts = decimalPlacesOptions.map((v) => ({
  value: v,
  label: v,
}));

export const BasisSection = () => {
  const {
    register,
    control,
    watch,
    setValue,
  } = useFormContext<ProductGroupFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Basis
      </h2>

      {/* Dimensions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FormLabel htmlFor="length">Length (mm)</FormLabel>
          <Input id="length" {...register("length")} />
        </div>
        <div>
          <FormLabel htmlFor="width">Width (mm)</FormLabel>
          <Input id="width" {...register("width")} />
        </div>
        <div>
          <FormLabel htmlFor="thickness">Thickness (mm)</FormLabel>
          <Input id="thickness" {...register("thickness")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="decimalPlaces"
          name="decimalPlaces"
          control={control}
          label="Decimal Places"
          options={decimalPlacesOpts}
          emptyValue=""
        />
        <label className="flex cursor-pointer items-center gap-3 pt-5">
          <Checkbox
            id="printDimensions"
            checked={watch("printDimensions")}
            onChange={(e) => setValue("printDimensions", e.target.checked)}
          />
          <span className="text-sm font-medium">Print Dimensions</span>
        </label>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="weight">Weight</FormLabel>
          <Input id="weight" {...register("weight")} />
        </div>
        <div>
          <FormLabel htmlFor="paintSurface">Paint Surface</FormLabel>
          <Input id="paintSurface" {...register("paintSurface")} />
        </div>
        <div>
          <FormLabel htmlFor="weightTheoretical">
            Weight Theoretical
          </FormLabel>
          <Input id="weightTheoretical" {...register("weightTheoretical")} />
        </div>
        <div>
          <FormLabel htmlFor="weightTrade">Weight Trade</FormLabel>
          <Input id="weightTrade" {...register("weightTrade")} />
        </div>
        <div>
          <FormLabel htmlFor="weightGerman">Weight German</FormLabel>
          <Input id="weightGerman" {...register("weightGerman")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="featuresQuality"
          name="featuresQuality"
          control={control}
          label="Features Quality"
          options={featuresQualityOptions}
          emptyValue=""
        />
        <FormSelectField
          id="standardsQuality"
          name="standardsQuality"
          control={control}
          label="Standards Quality"
          options={standardsQualityOptions}
          emptyValue=""
        />
        <FormSelectField
          id="tolerance"
          name="tolerance"
          control={control}
          label="Tolerance"
          options={standardsQualityOptions}
          emptyValue=""
        />
        <FormSelectField
          id="ce"
          name="ce"
          control={control}
          label="CE Standard"
          options={ceOptions}
          emptyValue=""
        />
        <FormSelectField
          id="processedOption"
          name="processedOption"
          control={control}
          label="Processed"
          options={processedOptionOptions}
          emptyValue=""
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="sourceProduct">Source Product</FormLabel>
          <Input id="sourceProduct" {...register("sourceProduct")} />
        </div>
        <div>
          <FormLabel htmlFor="industryNumber">Industry Number</FormLabel>
          <Input id="industryNumber" {...register("industryNumber")} />
        </div>
      </div>
    </section>
  );
};
