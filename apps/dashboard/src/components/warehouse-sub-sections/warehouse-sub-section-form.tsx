"use client";

import { useWarehouseSubSectionSubmit } from "@/app/(dashboard)/warehouse-sub-sections/use-warehouse-sub-section-submit";
import { WarehouseOption } from "@/app/(dashboard)/warehouses/actions";
import { WarehouseSubSectionOption } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { cn } from "@/lib/helpers";

type Props = {
  warehouses: WarehouseOption[];
  subSections: WarehouseSubSectionOption[];
};

export const WarehouseSubSectionForm = ({ warehouses, subSections }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    warehouseOptions,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    handleAdaptFrom,
    handleCancel,
  } = useWarehouseSubSectionSubmit({ warehouses, subSections });

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
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Adapt From
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectField
            id="warehouseUuid"
            name="warehouseUuid"
            control={control}
            label="Warehouse"
            options={warehouseOptions}
            emptyValue=""
            required
            errorMessage={errors.warehouseUuid?.message}
            onValueChange={(value, fieldOnChange) => {
              fieldOnChange(value);
              handleAdaptFrom(value);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          All fields are inherited from the selected warehouse. You can adjust
          any field before saving.
        </p>
      </section>

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

          <div>
            <FormLabel htmlFor="pickingSequence">Picking Sequence</FormLabel>
            <Input
              id="pickingSequence"
              type="number"
              min={1}
              {...register("pickingSequence", {
                setValueAs: (v) => (v === "" ? "" : Number(v)),
              })}
              aria-invalid={!!errors.pickingSequence}
            />
            <FormFieldError message={errors.pickingSequence?.message} />
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
        submitLabel="Save Sub Section"
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
