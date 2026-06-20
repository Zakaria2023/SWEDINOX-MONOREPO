"use client";

import { useWarehouseSubmit } from "@/app/(dashboard)/warehouses/use-warehouse-submit";
import { WarehouseOption } from "@/app/(dashboard)/warehouses/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  warehouseLoadingLocations,
  warehouseProductTypes,
  warehouseTransportRegions,
  WarehouseLoadingLocation,
  WarehouseProductType,
  WarehouseTransportRegion,
} from "@/lib/enums";
import {
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_PRODUCT_TYPE_LABELS,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/helpers";
import { useFieldArray } from "react-hook-form";

type Props = {
  existingWarehouses: WarehouseOption[];
};

const transportRegionOptions = warehouseTransportRegions.map((r) => ({
  value: r,
  label: WAREHOUSE_TRANSPORT_REGION_LABELS[r as WarehouseTransportRegion],
}));

const loadLocationOptions = warehouseLoadingLocations.map((l) => ({
  value: l,
  label: WAREHOUSE_LOADING_LOCATION_LABELS[l as WarehouseLoadingLocation],
}));

export const WarehouseForm = ({ existingWarehouses }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    addressOptions,
    adaptFromOptions,
    handleAdaptFrom,
    handleCancel,
  } = useWarehouseSubmit({ existingWarehouses });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "loadLocations",
  });

  const loadLocations = watch("loadLocations");

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {state.error && <FormError>{state.error}</FormError>}

      {/* Adapt From */}
      {adaptFromOptions.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Adapt From
          </h2>
          <div className="max-w-sm">
            <Select
              id="adaptFrom"
              name="adaptFrom"
              options={adaptFromOptions}
              onValueChange={(value) => handleAdaptFrom(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Select an existing warehouse to inherit its settings. You can adjust
            any field before saving.
          </p>
        </section>
      )}

      {/* General */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          General
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="name" required>
              Name
            </FormLabel>
            <Input
              id="name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <FormFieldError message={errors.name?.message} />
          </div>

          <FormSelectField
            id="locationType"
            name="locationType"
            control={control}
            label="Location Type"
            options={locationTypeOptions}
            emptyValue=""
          />

          <FormSelectField
            id="loadingLocation"
            name="loadingLocation"
            control={control}
            label="Loading Location"
            options={loadingLocationOptions}
            emptyValue=""
          />

          <FormSelectField
            id="address"
            name="address"
            control={control}
            label="Address"
            options={addressOptions}
            emptyValue=""
          />
        </div>
      </section>

      {/* Status */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </h2>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="blocked"
              checked={watch("blocked")}
              onChange={(e) => {
                setValue("blocked", e.target.checked);
                if (!e.target.checked) setValue("blockReason", "");
              }}
            />
            <span className="text-sm font-medium">Blocked</span>
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
              disabled={!blocked}
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
            <span className="text-sm font-medium">
              Blocked for Optimization
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="limitedDimensions"
              checked={watch("limitedDimensions")}
              onChange={(e) => setValue("limitedDimensions", e.target.checked)}
            />
            <span className="text-sm font-medium">Limited Dimensions</span>
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
                      {
                        WAREHOUSE_PRODUCT_TYPE_LABELS[
                          type as WarehouseProductType
                        ]
                      }
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* Load Locations */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Load Locations
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Transport Region
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Load Location
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No load locations added.
                  </td>
                </tr>
              )}
              {fields.map((field, index) => (
                <tr key={field.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <Select
                      id={`loadLocations.${index}.transportRegion`}
                      name={`loadLocations.${index}.transportRegion`}
                      options={transportRegionOptions}
                      value={loadLocations[index]?.transportRegion ?? ""}
                      onValueChange={(val) =>
                        setValue(
                          `loadLocations.${index}.transportRegion`,
                          val as WarehouseTransportRegion,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      id={`loadLocations.${index}.loadLocation`}
                      name={`loadLocations.${index}.loadLocation`}
                      options={loadLocationOptions}
                      value={loadLocations[index]?.loadLocation ?? ""}
                      onValueChange={(val) =>
                        setValue(
                          `loadLocations.${index}.loadLocation`,
                          val as WarehouseLoadingLocation,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() =>
            append({
              transportRegion: warehouseTransportRegions[0],
              loadLocation: warehouseLoadingLocations[0],
            })
          }
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          + Add Load Location
        </button>
      </section>

      <FormActions
        submitLabel="Save Warehouse"
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
