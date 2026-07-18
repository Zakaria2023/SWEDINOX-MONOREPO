"use client";

import { useFormContext } from "react-hook-form";
import { LocationFormValues } from "@/app/(dashboard)/locations/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { warehouseCountStockTypes } from "@/lib/enums";
import { WAREHOUSE_COUNT_STOCK_TYPE_LABELS } from "@/lib/labels";
import { asNumber } from "@/lib/helpers";

export const CountSettingsSection = () => {
  const { register } = useFormContext<LocationFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Count settings
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="w-28">
              <FormLabel htmlFor="countPer">Count</FormLabel>
              <Input
                id="countPer"
                type="number"
                min={0}
                {...register("countPer", { setValueAs: asNumber })}
              />
            </div>
            <span className="pb-2 text-sm text-muted-foreground">per</span>
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Counted this</span>
              <p className="font-medium">0</p>
            </div>
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Target date:</span>
              <p className="font-medium">—</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last count:</span>
              <p className="font-medium">—</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-foreground">
              Count as the
            </span>
            <div className="mt-2 space-y-2">
              {warehouseCountStockTypes.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    value={type}
                    className="accent-primary"
                    {...register("countAs")}
                  />
                  {WAREHOUSE_COUNT_STOCK_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="w-24">
              <FormLabel htmlFor="countUnderValue">under</FormLabel>
              <Input
                id="countUnderValue"
                type="number"
                min={0}
                {...register("countUnderValue", { setValueAs: asNumber })}
              />
            </div>
            <div className="w-32">
              <FormLabel htmlFor="countUnderUnit">Unit</FormLabel>
              <Input id="countUnderUnit" {...register("countUnderUnit")} />
            </div>
          </div>

          <FormCheckboxCard
            label="Open count order available"
            {...register("openCountOrderAvailable")}
          />
        </div>
      </div>
    </section>
  );
};
