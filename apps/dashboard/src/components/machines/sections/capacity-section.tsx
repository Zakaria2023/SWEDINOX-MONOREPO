"use client";

import { useFormContext, Controller } from "react-hook-form";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";

type Props = {
  capacityUnitOptions: SelectOption[];
};

export const CapacitySection = ({ capacityUnitOptions }: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<MachineFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Capacity
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <FormLabel htmlFor="averageDailyCapacity">Average Daily Capacity</FormLabel>
          <div className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] gap-2">
            <Input
              id="averageDailyCapacity"
              type="number"
              min={0}
              {...register("averageDailyCapacity", {
                setValueAs: (value) => (value === "" ? "" : Number(value)),
              })}
              aria-invalid={!!errors.averageDailyCapacity}
            />
            <Controller
              name="averageDailyCapacityUnit"
              control={control}
              render={({ field }) => (
                <Select
                  id="averageDailyCapacityUnit"
                  value={field.value ?? ""}
                  options={capacityUnitOptions}
                  columnHeaders={{ left: "Code", right: "Description" }}
                  onValueChange={field.onChange}
                />
              )}
            />
            <div className="flex items-center text-sm text-muted-foreground">
              per day
            </div>
          </div>
          <FormFieldError
            message={
              errors.averageDailyCapacity?.message ||
              errors.averageDailyCapacityUnit?.message
            }
          />
        </div>

        <div>
          <FormLabel htmlFor="warningPercentage">Warning %</FormLabel>
          <div className="flex items-center gap-2">
            <Input
              id="warningPercentage"
              type="number"
              min={0}
              max={100}
              {...register("warningPercentage", {
                setValueAs: (value) => (value === "" ? "" : Number(value)),
              })}
              aria-invalid={!!errors.warningPercentage}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <FormFieldError message={errors.warningPercentage?.message} />
        </div>
      </div>
    </section>
  );
};
