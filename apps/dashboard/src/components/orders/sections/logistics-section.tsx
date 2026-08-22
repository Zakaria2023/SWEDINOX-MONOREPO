"use client";

import { Controller, useFormContext } from "react-hook-form";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Input } from "@/components/shadcn/input";
import { TimePicker } from "@/components/shadcn/time-picker";
import { FormLabel } from "@/components/ui/form-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormSelectField } from "@/components/ui/form-select-field";
import { transportModes, warehouseTransportRegions } from "@/lib/enums";
import {
  asTransportMode,
  asTransportRegion,
  defaultTransportModeFor,
  enumOptions,
  estimatedTransitDays,
  pluralize,
  requiresCustomsDocuments,
} from "@/lib/helpers";
import {
  TRANSPORT_MODE_LABELS,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
} from "@/lib/labels";

const transportRegionOptions = enumOptions(
  warehouseTransportRegions,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
);
const transportModeOptions = enumOptions(transportModes, TRANSPORT_MODE_LABELS);

export const LogisticsSection = () => {
  const { register, control, watch } = useFormContext<OrderFormValues>();

  // The region and the mode decide how long the journey takes and whether
  // customs paperwork travels with it. Both were free text before, so neither
  // could be asked anything; now the order says what it implies while it is
  // being written.
  const region = asTransportRegion(watch("transportRegion"));
  const mode = asTransportMode(watch("transportMode"));
  const transitDays = estimatedTransitDays(region, mode);

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
        <FormSelectField
          control={control}
          id="transportRegion"
          name="transportRegion"
          label="Transport Region"
          options={transportRegionOptions}
          emptyValue=""
        />
        <div>
          <FormLabel htmlFor="maxLengthMm">Max. Length (mm)</FormLabel>
          <Input id="maxLengthMm" type="number" {...register("maxLengthMm")} />
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
          <Controller
            name="deliveryAfterTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                id="deliveryAfterTime"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div>
          <FormLabel htmlFor="deliverForTime">Deliver For</FormLabel>
          <Controller
            name="deliverForTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                id="deliverForTime"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <FormSelectField
          control={control}
          id="transportMode"
          name="transportMode"
          label="Transport Mode"
          options={transportModeOptions}
          emptyValue=""
        />
      </div>

      {region && (
        <p className="text-xs text-muted-foreground">
          {transitDays === null
            ? null
            : `Around ${transitDays} working ${pluralize(transitDays, "day", "days")} in transit`}
          {mode
            ? null
            : ` by ${TRANSPORT_MODE_LABELS[defaultTransportModeFor(region) ?? "road_transport"].toLowerCase()}`}
          {requiresCustomsDocuments(region)
            ? " — outside the customs union, so export documents travel with it"
            : " — inside the customs union, so no export declaration"}
        </p>
      )}
    </section>
  );
};
