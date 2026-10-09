"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { LocationEditValues } from "@/app/(dashboard)/locations/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { SelectOption } from "@/components/shadcn/select";
import { warehouseProductTypes, WarehouseProductType } from "@/lib/enums";
import { WAREHOUSE_PRODUCT_TYPE_LABELS } from "@/lib/labels";
import { blockReasonForLocationType, cn } from "@/lib/helpers";

type Props = {
  blocked: boolean;
  blockReasonOptions: SelectOption[];
};

export const StatusSection = ({ blocked, blockReasonOptions }: Props) => {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<LocationEditValues>();

  // 🔑 `Geblokkeerd`, `Reden` and `Beperkte afmetingen` are greyed on the
  // reference's location screen (246, `Reden: Location type setting`): they
  // follow from the location type, not from a tick. A type that blocks by its
  // nature sets both here; any other type leaves what is stored, because a
  // location blocked by hand stays blocked. `Geblokkeerd voor optimalisatie`
  // has no type behaviour behind it, so it stays a free tick.
  const typeBlockReason = blockReasonForLocationType(
    watch("locationType") || null,
  );

  useEffect(() => {
    if (typeBlockReason) {
      setValue("blocked", true);
      setValue("blockReason", typeBlockReason);
    }
  }, [typeBlockReason, setValue]);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Status
      </h2>
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox id="blocked" checked={watch("blocked")} readOnly disabled />
          <span className="text-sm font-medium text-muted-foreground">
            Blocked
          </span>
        </label>

        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 transition-opacity",
            !blocked && "pointer-events-none opacity-40",
          )}
        >
          <FormSelectField
            id="blockReason"
            name="blockReason"
            control={control}
            label="Reason"
            options={blockReasonOptions}
            emptyValue=""
            disabled
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="blockedForOptimization"
            checked={watch("blockedForOptimization")}
            onChange={(e) =>
              setValue("blockedForOptimization", e.target.checked)
            }
          />
          <span className="text-sm font-medium">Blocked for Optimization</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            id="limitedDimensions"
            checked={watch("limitedDimensions")}
            readOnly
            disabled
          />
          <span className="text-sm font-medium text-muted-foreground">
            Limited Dimensions
          </span>
        </label>
      </div>

      {/* Dimension Settings */}
      <section className="space-y-4 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Dimension Settings
        </h2>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <FormLabel htmlFor="minLength">Minimum Length</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="minLength"
                  type="number"
                  min={0}
                  {...register("minLength", {
                    setValueAs: (v) => (v === "" ? "" : Number(v)),
                  })}
                  aria-invalid={!!errors.minLength}
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
              <FormFieldError message={errors.minLength?.message} />
            </div>
            <div>
              <FormLabel htmlFor="maxLength">Maximum Length</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="maxLength"
                  type="number"
                  min={0}
                  {...register("maxLength", {
                    setValueAs: (v) => (v === "" ? "" : Number(v)),
                  })}
                  aria-invalid={!!errors.maxLength}
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
              <FormFieldError message={errors.maxLength?.message} />
            </div>
            <div>
              <FormLabel htmlFor="maxWidth">Maximum Width</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="maxWidth"
                  type="number"
                  min={0}
                  {...register("maxWidth", {
                    setValueAs: (v) => (v === "" ? "" : Number(v)),
                  })}
                  aria-invalid={!!errors.maxWidth}
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
              <FormFieldError message={errors.maxWidth?.message} />
            </div>
            <div>
              <FormLabel htmlFor="maxWeight">Maximum Weight</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="maxWeight"
                  type="number"
                  min={0}
                  {...register("maxWeight", {
                    setValueAs: (v) => (v === "" ? "" : Number(v)),
                  })}
                  aria-invalid={!!errors.maxWeight}
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
              <FormFieldError message={errors.maxWeight?.message} />
            </div>
          </div>
          <div>
            <FormLabel>Product Type</FormLabel>
            <div className="mt-2 space-y-3">
              {warehouseProductTypes.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    id={`productType-${type}`}
                    checked={watch("productTypes").includes(
                      type as WarehouseProductType,
                    )}
                    onChange={(e) => {
                      const current = watch("productTypes");
                      setValue(
                        "productTypes",
                        e.target.checked
                          ? [...current, type as WarehouseProductType]
                          : current.filter((t) => t !== type),
                      );
                    }}
                  />
                  <span className="text-sm font-medium">
                    {WAREHOUSE_PRODUCT_TYPE_LABELS[type as WarehouseProductType]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};
