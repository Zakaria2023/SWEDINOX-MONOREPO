"use client";

import { Controller, useFormContext } from "react-hook-form";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";

export const LogisticsSection = () => {
  const { register, control } = useFormContext<OrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Logistics</h2>

      <div className="grid grid-cols-3 gap-3">
        <Controller
          control={control}
          name="completeDelivery"
          render={({ field }) => (
            <FormCheckboxCard
              label="Complete delivery"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="transportBlockage"
          render={({ field }) => (
            <FormCheckboxCard
              label="Transport blockage"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="vehicleWithCrane"
          render={({ field }) => (
            <FormCheckboxCard
              label="Vehicle with crane required"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="vehicleWithCanopy"
          render={({ field }) => (
            <FormCheckboxCard
              label="Vehicle with canopy required"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="bundlingSeparate"
          render={({ field }) => (
            <FormCheckboxCard
              label="Bundling separate"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <FormLabel htmlFor="transportRegion">Transport Region</FormLabel>
          <Input id="transportRegion" {...register("transportRegion")} />
        </div>
        <div>
          <FormLabel htmlFor="maxLengthMm">Max. Length (mm)</FormLabel>
          <Input
            id="maxLengthMm"
            type="number"
            {...register("maxLengthMm")}
          />
        </div>
        <div>
          <FormLabel htmlFor="maxBundleWeightKg">
            Max. Bundle Weight (kg)
          </FormLabel>
          <Input
            id="maxBundleWeightKg"
            type="number"
            step="0.01"
            {...register("maxBundleWeightKg")}
          />
        </div>
        <div>
          <FormLabel htmlFor="deliveryAfterTime">Delivery After</FormLabel>
          <Input
            id="deliveryAfterTime"
            type="time"
            {...register("deliveryAfterTime")}
          />
        </div>
        <div>
          <FormLabel htmlFor="deliverForTime">Deliver For</FormLabel>
          <Input
            id="deliverForTime"
            type="time"
            {...register("deliverForTime")}
          />
        </div>
        <div>
          <FormLabel htmlFor="transportMode">Transport Mode</FormLabel>
          <Input id="transportMode" {...register("transportMode")} />
        </div>
      </div>
    </section>
  );
};
