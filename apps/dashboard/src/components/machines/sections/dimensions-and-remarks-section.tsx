"use client";

import { useFormContext } from "react-hook-form";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";

export const DimensionsAndRemarksSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<MachineFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Dimensions And Remarks
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="minLengthMm">Min Length</FormLabel>
          <div className="flex items-center gap-2">
            <Input
              id="minLengthMm"
              type="number"
              min={0}
              {...register("minLengthMm", {
                setValueAs: (value) => (value === "" ? "" : Number(value)),
              })}
              aria-invalid={!!errors.minLengthMm}
            />
            <span className="text-sm text-muted-foreground">mm</span>
          </div>
          <FormFieldError message={errors.minLengthMm?.message} />
        </div>

        <div>
          <FormLabel htmlFor="maxLengthMm">Max Length</FormLabel>
          <div className="flex items-center gap-2">
            <Input
              id="maxLengthMm"
              type="number"
              min={0}
              {...register("maxLengthMm", {
                setValueAs: (value) => (value === "" ? "" : Number(value)),
              })}
              aria-invalid={!!errors.maxLengthMm}
            />
            <span className="text-sm text-muted-foreground">mm</span>
          </div>
          <FormFieldError message={errors.maxLengthMm?.message} />
        </div>
      </div>

      <div>
        <FormLabel htmlFor="remarks">Remarks</FormLabel>
        <Textarea
          id="remarks"
          rows={5}
          {...register("remarks")}
          aria-invalid={!!errors.remarks}
        />
        <FormFieldError message={errors.remarks?.message} />
      </div>
    </section>
  );
};
