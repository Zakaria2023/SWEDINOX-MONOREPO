"use client";

import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";
import { WarehouseSubSectionEditValues } from "@/app/(dashboard)/warehouse-sub-sections/validation";

type Props = {
  locationTypeOptions: { value: string; label: string }[];
  loadingLocationOptions: { value: string; label: string }[];
};

export const GeneralSection = ({
  locationTypeOptions,
  loadingLocationOptions,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WarehouseSubSectionEditValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        General
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="name" required>
            Name
          </FormLabel>
          <Input
            id="name"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          <FormFieldError message={errors.name?.message} />
        </div>

        <div>
          <FormLabel htmlFor="pickingSequence">Picking Sequence</FormLabel>
          <Input
            id="pickingSequence"
            type="number"
            min={1}
            {...register("pickingSequence", {
              setValueAs: (v) => (v === "" ? "" : Number(v)),
            })}
            aria-invalid={!!errors.pickingSequence}
          />
          <FormFieldError message={errors.pickingSequence?.message} />
        </div>

        <FormSelectField
          id="locationType"
          name="locationType"
          control={control}
          label="Location Type"
          options={locationTypeOptions}
          emptyValue=""
        />

        <FormSelectField
          id="loadingLocation"
          name="loadingLocation"
          control={control}
          label="Loading Location"
          options={loadingLocationOptions}
          emptyValue=""
        />
      </div>
    </section>
  );
};
