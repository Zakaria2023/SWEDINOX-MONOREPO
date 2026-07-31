"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ProductFormValues } from "@/app/(dashboard)/products/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { salesUnitOptions, warehouseLocationTypes } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import {
  SALES_UNIT_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  locationOptions: SelectOption[];
};

const locationTypeOpts = enumOptions(
  warehouseLocationTypes,
  WAREHOUSE_LOCATION_TYPE_LABELS,
);
const unitOpts = enumOptions(salesUnitOptions, SALES_UNIT_LABELS);

const EMPTY_LOCATION = {
  locationUuid: "",
  preference: "1",
  locationType: "" as const,
  restockLevel: "0.000",
  restockLevelUnit: "" as const,
  restockLocationUuid: "",
  restockQty: "0.000",
  restockQtyUnit: "" as const,
};

// Where the article is meant to live, in preference order. The restock level
// and location are what turn a pick face into something that refills itself
// from bulk rather than simply running out.
export const PreferredLocationsSection = ({ locationOptions }: Props) => {
  const { control, register } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "preferredLocations",
  });

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h2 className="text-base font-semibold">Preferred location(s)</h2>
        <span className="text-xs text-muted-foreground">
          {fields.length} {fields.length === 1 ? "location" : "locations"}
        </span>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-xl border border-border bg-background p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Location {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="cursor-pointer text-muted-foreground hover:text-destructive"
                aria-label={`Delete preferred location ${index + 1}`}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FormLabel htmlFor={`preferredLocations.${index}.preference`}>
                  Preference
                </FormLabel>
                <Input
                  id={`preferredLocations.${index}.preference`}
                  type="number"
                  min={1}
                  {...register(`preferredLocations.${index}.preference`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`preferredLocations.${index}.locationUuid`}
                name={`preferredLocations.${index}.locationUuid`}
                label="Location"
                options={locationOptions}
                emptyValue=""
              />
              <FormSelectField
                control={control}
                id={`preferredLocations.${index}.locationType`}
                name={`preferredLocations.${index}.locationType`}
                label="Type"
                options={locationTypeOpts}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`preferredLocations.${index}.restockLevel`}>
                  Restock level
                </FormLabel>
                <Input
                  id={`preferredLocations.${index}.restockLevel`}
                  inputMode="decimal"
                  {...register(`preferredLocations.${index}.restockLevel`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`preferredLocations.${index}.restockLevelUnit`}
                name={`preferredLocations.${index}.restockLevelUnit`}
                label="Restock level unit"
                options={unitOpts}
                emptyValue=""
              />
              <FormSelectField
                control={control}
                id={`preferredLocations.${index}.restockLocationUuid`}
                name={`preferredLocations.${index}.restockLocationUuid`}
                label="Restock location"
                options={locationOptions}
                emptyValue=""
              />
              <div>
                <FormLabel htmlFor={`preferredLocations.${index}.restockQty`}>
                  Restock qty
                </FormLabel>
                <Input
                  id={`preferredLocations.${index}.restockQty`}
                  inputMode="decimal"
                  {...register(`preferredLocations.${index}.restockQty`)}
                />
              </div>
              <FormSelectField
                control={control}
                id={`preferredLocations.${index}.restockQtyUnit`}
                name={`preferredLocations.${index}.restockQtyUnit`}
                label="Restock qty unit"
                options={unitOpts}
                emptyValue=""
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append(EMPTY_LOCATION)}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          New preferred location
        </button>
      </div>
    </section>
  );
};
