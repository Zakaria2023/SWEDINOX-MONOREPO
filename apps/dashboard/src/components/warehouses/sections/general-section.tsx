"use client";

import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";

type Props = {
  locationTypeOptions: { value: string; label: string }[];
  loadingLocationOptions: { value: string; label: string }[];
  addressOptions: { value: string; label: string }[];
};

export const GeneralSection = ({
  locationTypeOptions,
  loadingLocationOptions,
  addressOptions,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WarehouseFormValues>();

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

        <FormSelectField
          id="address"
          name="address"
          control={control}
          label="Address"
          options={addressOptions}
          emptyValue=""
        />
      </div>
    </section>
  );
};
