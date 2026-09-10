"use client";

import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormSelectField } from "@/components/ui/form-select-field";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  isConsignment: boolean;
  orderTypeOptions: SelectOption[];
  weightTypeOptions: SelectOption[];
};

export const OrderTypeSection = ({
  isConsignment,
  orderTypeOptions,
  weightTypeOptions,
}: Props) => {
  const { register, control } = useFormContext<OrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Order Type</h2>

      <div className="grid grid-cols-3 gap-3">
        <Controller
          control={control}
          name="isPickup"
          render={({ field }) => (
            <FormCheckboxCard
              label="Pick-up"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="isIncidental"
          render={({ field }) => (
            <FormCheckboxCard
              label="Incidental"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="isInternalProduction"
          render={({ field }) => (
            <FormCheckboxCard
              label="Internal production / processing"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="isCustomerMaterial"
          render={({ field }) => (
            <FormCheckboxCard
              label="Customer material"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="isOverlength"
          render={({ field }) => (
            <FormCheckboxCard
              label="Overlength"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      {/* Consignment row */}
      <div className="flex items-center gap-4">
        <Controller
          control={control}
          name="isConsignment"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Consignment with a duration of
            </label>
          )}
        />
        {isConsignment && (
          <Input
            className="w-32"
            placeholder="e.g. 30 days"
            {...register("consignmentDuration")}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          control={control}
          id="orderType"
          name="orderType"
          label="Order type"
          options={orderTypeOptions}
        />

        <FormSelectField
          control={control}
          id="weightType"
          name="weightType"
          label="Weight type"
          options={weightTypeOptions}
          emptyValue=""
        />

        <div className="flex items-end gap-6 pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("isPrinted")} />
            Printed
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("isMailed")} />
            Mailed
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("isFaxed")} />
            Faxed
          </label>
        </div>
      </div>
    </section>
  );
};
