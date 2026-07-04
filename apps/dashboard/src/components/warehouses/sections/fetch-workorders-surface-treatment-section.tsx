"use client";

import { Checkbox } from "@/components/shadcn/checkbox";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";

type Props = {
  processingMethodOptions: { value: string; label: string }[];
  releaseMethodOptions: { value: string; label: string }[];
  printMethodOptions: { value: string; label: string }[];
};

export const FetchWorkordersSurfaceTreatmentSection = ({
  processingMethodOptions,
  releaseMethodOptions,
  printMethodOptions,
}: Props) => {
  const { control, watch, setValue } = useFormContext<WarehouseFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Fetch Workorders for Surface Treatment
      </h2>
      <label className="flex cursor-pointer items-center gap-3">
        <Checkbox
          id="surfaceTreatmentMakePerSubsection"
          checked={watch("surfaceTreatmentMakePerSubsection")}
          onChange={(e) =>
            setValue("surfaceTreatmentMakePerSubsection", e.target.checked)
          }
        />
        <span className="text-sm font-medium">
          Make workorders per subsection
        </span>
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="surfaceTreatmentProcessingMethod"
          name="surfaceTreatmentProcessingMethod"
          control={control}
          label="Processing Method"
          options={processingMethodOptions}
          emptyValue=""
        />
        <FormSelectField
          id="surfaceTreatmentReleaseMethod"
          name="surfaceTreatmentReleaseMethod"
          control={control}
          label="Release Method"
          options={releaseMethodOptions}
          emptyValue=""
        />
        <FormSelectField
          id="surfaceTreatmentPrintingMethod"
          name="surfaceTreatmentPrintingMethod"
          control={control}
          label="Printing Method"
          options={printMethodOptions}
          emptyValue=""
        />
      </div>
    </section>
  );
};
