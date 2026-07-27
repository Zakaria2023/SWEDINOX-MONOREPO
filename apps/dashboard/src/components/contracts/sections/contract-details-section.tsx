"use client";

import { ContractGroupOption } from "@/app/(dashboard)/contract-groups/actions";
import { ContractFormValues } from "@/app/(dashboard)/contracts/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { Controller, useFormContext } from "react-hook-form";

type ContractDetailsSectionProps = {
  isPending: boolean;
  groups: ContractGroupOption[];
};

export const ContractDetailsSection = ({
  isPending,
  groups,
}: ContractDetailsSectionProps) => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext<ContractFormValues>();

  const hasPriceDate = watch("hasPriceDate");

  const groupOptions = [
    { value: "", label: "Empty" },
    ...groups.map((g) => ({ value: g.uuid, label: g.name })),
  ];

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Contract
      </h2>
      <div className="grid gap-4">
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
                placeholder="e.g. BB"
                value={field.value}
                aria-invalid={!!errors.code}
                disabled={isPending}
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
          <FormLabel htmlFor="description" required>
            Description
          </FormLabel>
          <Input
            id="description"
            {...register("description")}
            aria-invalid={!!errors.description}
            disabled={isPending}
          />
          <FormFieldError message={errors.description?.message} />
        </div>

        <div>
          <FormLabel htmlFor="contractGroupUuid" required>
            Contract Group
          </FormLabel>
          <Controller
            name="contractGroupUuid"
            control={control}
            render={({ field }) => (
              <Select
                id="contractGroupUuid"
                options={groupOptions}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                placeholder="Empty"
                disabled={isPending}
              />
            )}
          />
          <FormFieldError message={errors.contractGroupUuid?.message} />
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="quicklyChangeOrder"
            className="shrink-0 text-sm font-medium text-gray-700"
          >
            Quickly Change Order
          </label>
          <Input
            id="quicklyChangeOrder"
            {...register("quicklyChangeOrder")}
            disabled={isPending}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasPriceDate"
            {...register("hasPriceDate")}
            className="size-4 accent-primary"
            disabled={isPending}
          />
          <label
            htmlFor="hasPriceDate"
            className="shrink-0 text-sm font-medium text-gray-700"
          >
            Price Date
          </label>
          {hasPriceDate && (
            <Controller
              name="priceDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isPending}
                  className="w-44"
                />
              )}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="linkToNewCustomer"
            {...register("linkToNewCustomer")}
            className="size-4 accent-primary"
            disabled={isPending}
          />
          <label
            htmlFor="linkToNewCustomer"
            className="text-sm font-medium text-gray-700"
          >
            Link this contract to a new customer
          </label>
        </div>
      </div>
    </section>
  );
};
