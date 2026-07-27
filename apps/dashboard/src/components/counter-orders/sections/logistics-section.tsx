"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { Input } from "@/components/shadcn/input";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { transportModes, warehouseTransportRegions } from "@/lib/enums";
import { TRANSPORT_MODE_LABELS, WAREHOUSE_TRANSPORT_REGION_LABELS } from "@/lib/labels";

const transportRegionOptions = [
  { value: "", label: "Empty" },
  ...warehouseTransportRegions.map((region) => ({
    value: region,
    label: WAREHOUSE_TRANSPORT_REGION_LABELS[region],
  })),
];

const transportModeOptions = [
  { value: "", label: "Empty" },
  ...transportModes.map((mode) => ({
    value: mode,
    label: TRANSPORT_MODE_LABELS[mode],
  })),
];

export const LogisticsSection = () => {
  const { register, control } = useFormContext<CounterOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Logistics
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormSelectField
          control={control}
          id="transportRegion"
          name="transportRegion"
          label="Transport region"
          options={transportRegionOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="maxLengthMm">Max. Length (mm)</FormLabel>
          <Input id="maxLengthMm" type="number" {...register("maxLengthMm")} />
        </div>
        <div>
          <FormLabel htmlFor="maxBundleWeightKg">
            Max. Bundle weight (kg)
          </FormLabel>
          <Input
            id="maxBundleWeightKg"
            type="number"
            step="0.01"
            {...register("maxBundleWeightKg")}
          />
        </div>
        <div>
          <FormLabel htmlFor="deliveryAfterTime">Delivery after</FormLabel>
          <Input
            id="deliveryAfterTime"
            type="time"
            {...register("deliveryAfterTime")}
          />
        </div>
        <div>
          <FormLabel htmlFor="deliverForTime">Deliver for</FormLabel>
          <Input
            id="deliverForTime"
            type="time"
            {...register("deliverForTime")}
          />
        </div>
        <FormSelectField
          control={control}
          id="transportMode"
          name="transportMode"
          label="Transport mode"
          options={transportModeOptions}
          emptyValue=""
        />
      </div>
    </section>
  );
};
