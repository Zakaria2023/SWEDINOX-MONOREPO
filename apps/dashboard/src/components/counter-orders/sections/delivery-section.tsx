"use client";

import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
  addressOptions: SelectOption[];
  deliveryTermOptions: SelectOption[];
};

export const DeliverySection = ({
  isPending,
  addressOptions,
  deliveryTermOptions,
}: Props) => {
  const { control, register, watch } = useFormContext<CounterOrderFormValues>();
  const isPickup = watch("isPickup");

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Delivery
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
        <FormSelectField
          control={control}
          id="deliveryTerms"
          name="deliveryTerms"
          label="Delivery terms"
          options={deliveryTermOptions}
          emptyValue=""
          disabled={isPending || isPickup}
        />

        <FormSelectField
          control={control}
          id="deliveryAddressUuid"
          name="deliveryAddressUuid"
          label="Delivery address"
          options={addressOptions}
          emptyValue=""
          disabled={isPending || isPickup || addressOptions.length === 0}
        />

        <div>
          <FormLabel htmlFor="deliveryDate">Delivery date</FormLabel>
          <Controller
            name="deliveryDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>

        <div>
          <FormLabel htmlFor="deliveryRemark">Delivery remark</FormLabel>
          <Input
            id="deliveryRemark"
            {...register("deliveryRemark")}
            disabled={isPending}
          />
        </div>
      </div>
    </section>
  );
};
