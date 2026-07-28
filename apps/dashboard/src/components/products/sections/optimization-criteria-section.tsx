"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";

type FactorProps = {
  name: keyof ProductFormValues;
  label: string;
};

// The weighting factors the sawing optimiser balances. They are relative, not
// absolute: raising one only matters against the others, which is why the
// reference bounds them all to the same 0–999 range.
const FACTORS: FactorProps[] = [
  { name: "optFactorBundles", label: "# bundles" },
  { name: "optFactorPriorityLocationType", label: "Priority location type" },
  { name: "optFactorSawingCuts", label: "# sawing cuts" },
  { name: "optFactorCreatedOffcuts", label: "# created offcuts" },
  { name: "optFactorCreatedScrapPieces", label: "# created scrap pieces" },
  { name: "optFactorUsedTradeLengths", label: "# used trade lengths" },
  { name: "optFactorUsedOffcuts", label: "# used offcuts" },
  { name: "optFactorScrapPieceLength", label: "Length of scrap pieces" },
  {
    name: "optFactorOffcutsBelowPreferred",
    label: "# offcuts below preferred min. length",
  },
  { name: "optFactorLengthCutoffs", label: "Length cutoffs" },
];

export const OptimizationCriteriaSection = () => {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <section className="space-y-5">
      <h2 className="border-b pb-2 text-base font-semibold">
        Optimization criteria
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Trade lengths (mm)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="optTradeLengthTolerance">Tolerance</FormLabel>
              <Input
                id="optTradeLengthTolerance"
                type="number"
                {...register("optTradeLengthTolerance")}
              />
            </div>
            <div>
              <FormLabel htmlFor="optEndSpace">End space</FormLabel>
              <Input
                id="optEndSpace"
                type="number"
                {...register("optEndSpace")}
              />
            </div>
            <div>
              <FormLabel htmlFor="optClamping">Clamping</FormLabel>
              <Input
                id="optClamping"
                type="number"
                {...register("optClamping")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Offcuts (mm)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="optOffcutMinLength">Min. length</FormLabel>
              <Input
                id="optOffcutMinLength"
                type="number"
                {...register("optOffcutMinLength")}
              />
            </div>
            <div>
              <FormLabel htmlFor="optOffcutPreferredMin">
                Preferred min.
              </FormLabel>
              <Input
                id="optOffcutPreferredMin"
                type="number"
                {...register("optOffcutPreferredMin")}
              />
            </div>
            <div>
              <FormLabel htmlFor="optClampingEdge">Clamping edge</FormLabel>
              <Input
                id="optClampingEdge"
                type="number"
                {...register("optClampingEdge")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Factors (between 0 and 999)
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FACTORS.map((factor) => (
            <div key={factor.name}>
              <FormLabel htmlFor={factor.name}>{factor.label}</FormLabel>
              <Input
                id={factor.name}
                type="number"
                min={0}
                max={999}
                {...register(factor.name as "optFactorBundles")}
              />
            </div>
          ))}
        </div>
      </div>

      <Controller
        control={control}
        name="optAllowLongestOffcuts"
        render={({ field }) => (
          <FormCheckboxCard
            label="Allow the longest possible offcuts to be created"
            checked={field.value}
            active={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
          />
        )}
      />
    </section>
  );
};
