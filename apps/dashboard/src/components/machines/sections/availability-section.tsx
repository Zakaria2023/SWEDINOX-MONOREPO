"use client";

import { useFormContext, Controller } from "react-hook-form";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Checkbox } from "@/components/shadcn/checkbox";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { cn } from "@/lib/helpers";

export const AvailabilitySection = () => {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<MachineFormValues>();

  const outOfBusiness = watch("outOfBusiness");

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Availability
      </h2>
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="outOfBusiness"
            checked={outOfBusiness}
            onChange={(e) => {
              setValue("outOfBusiness", e.target.checked);
              if (!e.target.checked) {
                setValue("outOfBusinessFrom", "");
                setValue("outOfBusinessUntil", "");
              }
            }}
          />
          <span className="text-sm font-medium">Out of business</span>
        </label>

        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 transition-opacity",
            !outOfBusiness && "pointer-events-none opacity-40",
          )}
        >
          <div>
            <FormLabel htmlFor="outOfBusinessFrom">From</FormLabel>
            <Controller
              name="outOfBusinessFrom"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={!outOfBusiness}
                />
              )}
            />
            <FormFieldError message={errors.outOfBusinessFrom?.message} />
          </div>

          <div>
            <FormLabel htmlFor="outOfBusinessUntil">Until</FormLabel>
            <Controller
              name="outOfBusinessUntil"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={!outOfBusiness}
                />
              )}
            />
            <FormFieldError message={errors.outOfBusinessUntil?.message} />
          </div>
        </div>
      </div>
    </section>
  );
};
