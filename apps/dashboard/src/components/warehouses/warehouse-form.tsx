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
import { cn } from "@/lib/helpers";

type Props = {
  existingWarehouses: WarehouseOption[];
};

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
      </section>

      <FormActions
        submitLabel="Save Warehouse"
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
