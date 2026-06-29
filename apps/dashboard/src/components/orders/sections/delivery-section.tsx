"use client";

import { Controller, useFormContext } from "react-hook-form";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { SelectOption } from "@/components/shadcn/select";

type Props = {
  isPickup: boolean;
  deliveryType: string;
  addressOptions: SelectOption[];
  deliveryTermOptions: SelectOption[];
};

export const DeliverySection = ({
  isPickup,
  deliveryType,
  addressOptions,
  deliveryTermOptions,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Delivery</h2>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          control={control}
          id="deliveryTerms"
          name="deliveryTerms"
          label="Delivery Terms"
          options={deliveryTermOptions}
          emptyValue=""
          disabled={isPickup}
        />

        <FormSelectField
          control={control}
          id="deliveryAddressUuid"
          name="deliveryAddressUuid"
          label="Delivery Address"
          options={addressOptions}
          emptyValue=""
          disabled={isPickup || addressOptions.length <= 1}
        />
      </div>

      {/* Delivery date / week toggle */}
      <div className="space-y-3">
        <FormLabel>Delivery Planned</FormLabel>
        <div className="flex gap-6">
          <Controller
            control={control}
            name="deliveryType"
            render={({ field }) => (
              <>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value="date"
                    checked={field.value === "date"}
                    onChange={() => field.onChange("date")}
                  />
                  Date
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value="week"
                    checked={field.value === "week"}
                    onChange={() => field.onChange("week")}
                  />
                  Week
                </label>
              </>
            )}
          />
        </div>

        {deliveryType === "date" ? (
          <Input type="date" className="w-48" {...register("deliveryDate")} />
        ) : (
          <div className="flex items-center gap-2">
            <div>
              <FormLabel htmlFor="deliveryWeek">Week</FormLabel>
              <Input
                id="deliveryWeek"
                type="number"
                min={1}
                max={53}
                className="w-20"
                {...register("deliveryWeek", {
                  setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
                })}
              />
              <FormFieldError message={errors.deliveryWeek?.message} />
            </div>
            <div>
              <FormLabel htmlFor="deliveryYear">Year</FormLabel>
              <Input
                id="deliveryYear"
                type="number"
                min={2000}
                max={2099}
                className="w-28"
                {...register("deliveryYear", {
                  setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
                })}
              />
              <FormFieldError message={errors.deliveryYear?.message} />
            </div>
          </div>
        )}
      </div>

      <div>
        <FormLabel htmlFor="deliveryRemark">Delivery Remark</FormLabel>
        <Input id="deliveryRemark" {...register("deliveryRemark")} />
      </div>
    </section>
  );
};
