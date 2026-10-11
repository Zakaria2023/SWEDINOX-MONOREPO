"use client";

import { Controller, useFormContext } from "react-hook-form";
import { ReturnOrderFormValues } from "@/app/(dashboard)/return-orders/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { TimePicker } from "@/components/shadcn/time-picker";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

const LOGISTICS_SWITCHES = [
  ["completeDelivery", "Complete delivery"],
  ["transportBlockage", "Transport blockage"],
  ["vehicleWithCrane", "Vehicle with crane required"],
  ["vehicleWithCanopy", "Vehicle with canopy required"],
  ["bundlingSeparate", "Bundling separate"],
] as const;

type Props = {
  transportRegionOptions: SelectOption[];
  transportModeOptions: SelectOption[];
};

/** The `Logistics` panel: how the goods travel back to us. */
export const LogisticsSection = ({
  transportRegionOptions,
  transportModeOptions,
}: Props) => {
  const { control, register } = useFormContext<ReturnOrderFormValues>();

  return (
    <CollapsibleSection title="Logistics">
      <div className="space-y-4 p-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {LOGISTICS_SWITCHES.map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <FormCheckboxCard
                  label={label}
                  checked={field.value}
                  active={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormSelectField
            control={control}
            id="transportRegion"
            name="transportRegion"
            label="Transport"
            options={transportRegionOptions}
            emptyValue=""
          />
          <FormSelectField
            control={control}
            id="transportMode"
            name="transportMode"
            label="Transport mode"
            options={transportModeOptions}
            emptyValue=""
          />
          <div>
            <FormLabel htmlFor="deliveryAfterTime">Delivery after</FormLabel>
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
            <FormLabel htmlFor="deliverForTime">Deliver for</FormLabel>
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
              Max. Bundle weight (kg)
            </FormLabel>
            <Input
              id="maxBundleWeightKg"
              type="number"
              step="0.01"
              {...register("maxBundleWeightKg")}
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};
