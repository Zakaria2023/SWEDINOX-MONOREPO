"use client";

import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";

type Props = {
  countMethodOptions: { value: string; label: string }[];
  releaseMethodOptions: { value: string; label: string }[];
  printMethodOptions: { value: string; label: string }[];
};

export const CountWorkordersSection = ({
  countMethodOptions,
  releaseMethodOptions,
  printMethodOptions,
}: Props) => {
  const { register, control, watch, setValue } =
    useFormContext<WarehouseFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Count Workorders
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          id="countMethod"
          name="countMethod"
          control={control}
          label="Count Method"
          options={countMethodOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="countMaxLinesPerCommand">
            Max. # Lines / Command
          </FormLabel>
          <Input
            id="countMaxLinesPerCommand"
            type="number"
            min={0}
            {...register("countMaxLinesPerCommand", {
              setValueAs: (v) => (v === "" ? "" : Number(v)),
            })}
          />
        </div>
        <FormSelectField
          id="countReleaseMethod"
          name="countReleaseMethod"
          control={control}
          label="Release Method"
          options={releaseMethodOptions}
          emptyValue=""
        />
        <FormSelectField
          id="countPrintMethod"
          name="countPrintMethod"
          control={control}
          label="Print Method"
          options={printMethodOptions}
          emptyValue=""
        />
      </div>
      <label className="flex cursor-pointer items-center gap-3">
        <Checkbox
          id="countPrintStockOnSlip"
          checked={watch("countPrintStockOnSlip")}
          onChange={(e) => setValue("countPrintStockOnSlip", e.target.checked)}
        />
        <span className="text-sm font-medium">
          Print stock on count workorder slip
        </span>
      </label>
    </section>
  );
};
