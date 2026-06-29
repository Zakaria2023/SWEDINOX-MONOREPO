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

export const PickingWorkordersSection = ({
  processingMethodOptions,
  releaseMethodOptions,
  printMethodOptions,
}: Props) => {
  const { control, watch, setValue } = useFormContext<WarehouseFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Picking Workorders
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="pickingProcessingMethod"
          name="pickingProcessingMethod"
          control={control}
          label="Processing Method"
          options={processingMethodOptions}
          emptyValue=""
        />
        <FormSelectField
          id="pickingReleaseMethod"
          name="pickingReleaseMethod"
          control={control}
          label="Release Method"
          options={releaseMethodOptions}
          emptyValue=""
        />
        <FormSelectField
          id="pickingPrintingMethod"
          name="pickingPrintingMethod"
          control={control}
          label="Printing Method"
          options={printMethodOptions}
          emptyValue=""
        />
      </div>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="packagingMandatoryOnCompletion"
            checked={watch("packagingMandatoryOnCompletion")}
            onChange={(e) =>
              setValue("packagingMandatoryOnCompletion", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Packaging mandatory when reporting completion of picking or last
            production
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="packagingDialogueOnCompletion"
            checked={watch("packagingDialogueOnCompletion")}
            onChange={(e) =>
              setValue("packagingDialogueOnCompletion", e.target.checked)
            }
          />
          <span className="text-sm font-medium">
            Packaging dialogue when reporting completion of picking or last
            production workorder
          </span>
        </label>
      </div>
    </section>
  );
};
