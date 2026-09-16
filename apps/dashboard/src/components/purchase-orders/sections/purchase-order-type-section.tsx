"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { SelectOption } from "@/components/shadcn/select";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";

type Props = {
  purchaseOrderTypeOptions: SelectOption[];
  weightTypeOptions: SelectOption[];
};

export const PurchaseOrderTypeSection = ({
  purchaseOrderTypeOptions,
  weightTypeOptions,
}: Props) => {
  const { register, control } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Purchase Order Type
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          control={control}
          id="purchaseOrderType"
          name="purchaseOrderType"
          label="Type"
          options={purchaseOrderTypeOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="weightType"
          name="weightType"
          label="Weight type"
          options={weightTypeOptions}
          emptyValue=""
        />
      </div>

      <div className="flex flex-wrap gap-4">
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
        <Controller
          control={control}
          name="doNotPrintPrices"
          render={({ field }) => (
            <FormCheckboxCard
              label="Do not print prices"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      <div className="flex gap-6">
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
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" {...register("messageSentViaStaalWeb")} />
          Message sent via StaalWeb
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" {...register("deliberatelyNotSent")} />
          Deliberately not sent
        </label>
      </div>
    </section>
  );
};
