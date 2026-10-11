"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  deliveryTermOptions: SelectOption[];
  addressOptions: SelectOption[];
};

/**
 * The reference's `Delivery` group: `Delivery terms`, `Delivery address`, a
 * `Date` / `Week` + `Year` choice with its remark, and the `Keuzehulp`
 * (choice aid) button beside it. A pick-up has no terms and no address.
 */
export const QuoteDeliverySection = ({
  deliveryTermOptions,
  addressOptions,
}: Props) => {
  const { register, control } = useFormContext<QuoteFormValues>();
  const [isPickup, deliveryType] = useWatch({
    control,
    name: ["isPickup", "deliveryType"],
  });

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Delivery</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField
          control={control}
          id="deliveryTerms"
          name="deliveryTerms"
          label="Delivery terms"
          options={deliveryTermOptions}
          emptyValue=""
          disabled={isPickup}
        />

        <FormSelectField
          control={control}
          id="deliveryAddressUuid"
          name="deliveryAddressUuid"
          label="Delivery address"
          options={addressOptions}
          emptyValue=""
          disabled={isPickup || addressOptions.length <= 1}
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Controller
          control={control}
          name="deliveryType"
          render={({ field }) => (
            <div className="flex gap-4 pb-2">
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
            </div>
          )}
        />

        {deliveryType === "date" ? (
          <div>
            <FormLabel htmlFor="deliveryDate">Date</FormLabel>
            <Controller
              name="deliveryDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="deliveryDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className="w-44"
                />
              )}
            />
          </div>
        ) : (
          <>
            <div>
              <FormLabel htmlFor="deliveryWeek">Week</FormLabel>
              <Input
                id="deliveryWeek"
                type="number"
                min={1}
                max={53}
                className="w-20"
                {...register("deliveryWeek")}
              />
            </div>
            <div>
              <FormLabel htmlFor="deliveryYear">Year</FormLabel>
              <Input
                id="deliveryYear"
                type="number"
                className="w-24"
                {...register("deliveryYear")}
              />
            </div>
          </>
        )}

        <div>
          <FormLabel htmlFor="deliveryRemark">Rem.</FormLabel>
          <Input
            id="deliveryRemark"
            className="w-40"
            {...register("deliveryRemark")}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="Not built yet"
        >
          Keuzehulp
        </Button>
      </div>
    </div>
  );
};
