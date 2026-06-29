"use client";

import { useFormContext, Controller } from "react-hook-form";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { SelectOption } from "@/components/shadcn/select";

type Props = {
  optionOptions: SelectOption[];
  productionOptions: SelectOption[];
  loadingOptions: SelectOption[];
  stockLocationOptions: SelectOption[];
};

export const GeneralSection = ({
  optionOptions,
  productionOptions,
  loadingOptions,
  stockLocationOptions,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<MachineFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        General
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor="code" required>
            Code
          </FormLabel>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Input
                id="code"
                value={field.value}
                aria-invalid={!!errors.code}
                onChange={(e) =>
                  field.onChange(e.target.value.toUpperCase())
                }
                onBlur={field.onBlur}
              />
            )}
          />
          <FormFieldError message={errors.code?.message} />
        </div>

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
          id="option"
          name="option"
          control={control}
          label="Option"
          options={optionOptions}
          emptyValue=""
          required
          errorMessage={errors.option?.message}
        />

        <FormSelectField
          id="production"
          name="production"
          control={control}
          label="Production"
          options={productionOptions}
          emptyValue=""
          required
          errorMessage={errors.production?.message}
        />

        <FormSelectField
          id="loading"
          name="loading"
          control={control}
          label="Loading"
          options={loadingOptions}
          emptyValue=""
          required
          errorMessage={errors.loading?.message}
        />

        <FormSelectField
          id="stockLocationUuid"
          name="stockLocationUuid"
          control={control}
          label="Stock Location"
          options={stockLocationOptions}
          emptyValue=""
          required
          errorMessage={errors.stockLocationUuid?.message}
        />
      </div>
    </section>
  );
};
