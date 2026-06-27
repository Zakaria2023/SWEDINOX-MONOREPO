"use client";

import { Controller } from "react-hook-form";
import { useMachineSubmit } from "@/app/(dashboard)/machines/use-machine-submit";
import type { MachineStockLocationOption } from "@/app/(dashboard)/warehouses/actions";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { DocumentUploader } from "@/components/document-uploader";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { cn } from "@/lib/helpers";

type Props = {
  stockLocations: MachineStockLocationOption[];
};

export const MachineForm = ({ stockLocations }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    stockLocationOptions,
    optionOptions,
    productionOptions,
    loadingOptions,
    capacityUnitOptions,
    handleCancel,
  } = useMachineSubmit({ stockLocations });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const outOfBusiness = watch("outOfBusiness");

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          General
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="code" required>
              Code
            </FormLabel>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  id="code"
                  value={field.value}
                  aria-invalid={!!errors.code}
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase())
                  }
                  onBlur={field.onBlur}
                />
              )}
            />
            <FormFieldError message={errors.code?.message} />
          </div>

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
            id="option"
            name="option"
            control={control}
            label="Option"
            options={optionOptions}
            emptyValue=""
            required
            errorMessage={errors.option?.message}
          />

          <FormSelectField
            id="production"
            name="production"
            control={control}
            label="Production"
            options={productionOptions}
            emptyValue=""
            required
            errorMessage={errors.production?.message}
          />

          <FormSelectField
            id="loading"
            name="loading"
            control={control}
            label="Loading"
            options={loadingOptions}
            emptyValue=""
            required
            errorMessage={errors.loading?.message}
          />

          <FormSelectField
            id="stockLocationUuid"
            name="stockLocationUuid"
            control={control}
            label="Stock Location"
            options={stockLocationOptions}
            emptyValue=""
            required
            errorMessage={errors.stockLocationUuid?.message}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Dimensions And Remarks
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="minLengthMm">Min Length</FormLabel>
            <div className="flex items-center gap-2">
              <Input
                id="minLengthMm"
                type="number"
                min={0}
                {...register("minLengthMm", {
                  setValueAs: (value) => (value === "" ? "" : Number(value)),
                })}
                aria-invalid={!!errors.minLengthMm}
              />
              <span className="text-sm text-muted-foreground">mm</span>
            </div>
            <FormFieldError message={errors.minLengthMm?.message} />
          </div>

          <div>
            <FormLabel htmlFor="maxLengthMm">Max Length</FormLabel>
            <div className="flex items-center gap-2">
              <Input
                id="maxLengthMm"
                type="number"
                min={0}
                {...register("maxLengthMm", {
                  setValueAs: (value) => (value === "" ? "" : Number(value)),
                })}
                aria-invalid={!!errors.maxLengthMm}
              />
              <span className="text-sm text-muted-foreground">mm</span>
            </div>
            <FormFieldError message={errors.maxLengthMm?.message} />
          </div>
        </div>

        <div>
          <FormLabel htmlFor="remarks">Remarks</FormLabel>
          <Textarea
            id="remarks"
            rows={5}
            {...register("remarks")}
            aria-invalid={!!errors.remarks}
          />
          <FormFieldError message={errors.remarks?.message} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Availability
        </h2>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              id="outOfBusiness"
              checked={outOfBusiness}
              onChange={(e) => {
                setValue("outOfBusiness", e.target.checked);
                if (!e.target.checked) {
                  setValue("outOfBusinessFrom", "");
                  setValue("outOfBusinessUntil", "");
                }
              }}
            />
            <span className="text-sm font-medium">Out of business</span>
          </label>

          <div
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2 transition-opacity",
              !outOfBusiness && "pointer-events-none opacity-40",
            )}
          >
            <div>
              <FormLabel htmlFor="outOfBusinessFrom">From</FormLabel>
              <Controller
                name="outOfBusinessFrom"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={!outOfBusiness}
                  />
                )}
              />
              <FormFieldError message={errors.outOfBusinessFrom?.message} />
            </div>

            <div>
              <FormLabel htmlFor="outOfBusinessUntil">Until</FormLabel>
              <Controller
                name="outOfBusinessUntil"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={!outOfBusiness}
                  />
                )}
              />
              <FormFieldError message={errors.outOfBusinessUntil?.message} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Capacity
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <FormLabel htmlFor="averageDailyCapacity">Average Daily Capacity</FormLabel>
            <div className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] gap-2">
              <Input
                id="averageDailyCapacity"
                type="number"
                min={0}
                {...register("averageDailyCapacity", {
                  setValueAs: (value) => (value === "" ? "" : Number(value)),
                })}
                aria-invalid={!!errors.averageDailyCapacity}
              />
              <Controller
                name="averageDailyCapacityUnit"
                control={control}
                render={({ field }) => (
                  <Select
                    id="averageDailyCapacityUnit"
                    value={field.value ?? ""}
                    options={capacityUnitOptions}
                    columnHeaders={{ left: "Code", right: "Description" }}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <div className="flex items-center text-sm text-muted-foreground">
                per day
              </div>
            </div>
            <FormFieldError
              message={
                errors.averageDailyCapacity?.message ||
                errors.averageDailyCapacityUnit?.message
              }
            />
          </div>

          <div>
            <FormLabel htmlFor="warningPercentage">Warning %</FormLabel>
            <div className="flex items-center gap-2">
              <Input
                id="warningPercentage"
                type="number"
                min={0}
                max={100}
                {...register("warningPercentage", {
                  setValueAs: (value) => (value === "" ? "" : Number(value)),
                })}
                aria-invalid={!!errors.warningPercentage}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <FormFieldError message={errors.warningPercentage?.message} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </h2>
        <div className="space-y-2">
          {watch("documents").map((doc, index) => (
            <div key={doc.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{doc.fileName}</span>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/documents/${doc.id}/delete`, {
                    method: "DELETE",
                  });
                  const current = watch("documents");
                  setValue(
                    "documents",
                    current.filter((_, currentIndex) => currentIndex !== index),
                  );
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                x
              </button>
            </div>
          ))}
        </div>

        <DocumentUploader
          onSuccess={(uploads) => {
            const current = watch("documents");
            setValue("documents", [
              ...current,
              ...uploads.map((upload) => ({
                id: upload.documentId,
                fileName: upload.fileName,
              })),
            ]);
          }}
        />
      </section>

      {state.error && <FormError>{state.error}</FormError>}

      <FormActions
        submitLabel="Save Machine"
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
