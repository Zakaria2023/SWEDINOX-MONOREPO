"use client";

import { useLocationSubmit } from "@/app/(dashboard)/locations/use-location-submit";
import { type AddressOption, type LoadingLocationOption } from "@/app/(dashboard)/locations/actions";
import { locationAdoptPositions, locationTypes } from "@/lib/enums";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormError } from "@/components/ui/form-error";
import { AddressSelect } from "@/components/locations/address-select";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const locationTypeOptions = locationTypes.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " "),
}));

const adoptPositionOptions = locationAdoptPositions.map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1),
}));

type LocationFormProps = {
  loadingLocations: LoadingLocationOption[];
  addresses: AddressOption[];
};

export const LocationForm = ({ loadingLocations, addresses }: LocationFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useLocationSubmit();
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const isBlocked = watch("isBlocked");

  useEffect(() => {
    if (state.success) router.push("/locations");
  }, [state.success, router]);

  const loadingLocationOptions = [
    { value: "", label: "-empty-" },
    ...loadingLocations.map((ll) => ({ value: ll.uuid, label: ll.name })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Location Details
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 lg:grid-cols-2">
          <div>
            <FormLabel htmlFor="name" required>
              Name
            </FormLabel>
            <Input
              id="name"
              {...register("name")}
              aria-invalid={!!errors.name}
              placeholder="Enter location name"
              disabled={isPending}
            />
            <FormFieldError message={errors.name?.message} />
          </div>

          <FormSelectField
            control={control}
            id="locationType"
            name="locationType"
            label="Location Type"
            required
            options={locationTypeOptions}
            placeholder="Select type"
            errorMessage={errors.locationType?.message}
            invalid={!!errors.locationType}
            disabled={isPending}
          />

          <FormSelectField
            control={control}
            id="loadingLocationUuid"
            name="loadingLocationUuid"
            label="Loading Location"
            options={loadingLocationOptions}
            emptyValue=""
            disabled={isPending}
          />

          <div>
            <FormLabel htmlFor="addressUuid">Address</FormLabel>
            <Controller
              control={control}
              name="addressUuid"
              render={({ field }) => (
                <AddressSelect
                  id="addressUuid"
                  name={field.name}
                  addresses={addresses}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={isPending}
                  invalid={!!errors.addressUuid}
                />
              )}
            />
            <FormFieldError message={errors.addressUuid?.message} />
          </div>

          <div>
            <FormLabel htmlFor="pickingSequence">Picking Sequence</FormLabel>
            <Input
              id="pickingSequence"
              type="number"
              min={0}
              {...register("pickingSequence")}
              aria-invalid={!!errors.pickingSequence}
              placeholder="e.g. 10"
              disabled={isPending}
            />
            <FormFieldError message={errors.pickingSequence?.message as string | undefined} />
          </div>

          <div>
            <FormLabel htmlFor="adoptFrom">Adopt From</FormLabel>
            <Input
              id="adoptFrom"
              {...register("adoptFrom")}
              placeholder="Location to adopt from"
              disabled={isPending}
            />
          </div>

          <FormSelectField
            control={control}
            id="adoptPosition"
            name="adoptPosition"
            label="Adopt Position"
            options={adoptPositionOptions}
            disabled={isPending}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Flags
        </h2>
        <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              { name: "isBlocked", label: "Blocked" },
              { name: "blockedForOptimization", label: "Blocked for Optimization" },
              { name: "limitedDimensions", label: "Limited Dimensions" },
            ] as const
          ).map(({ name, label }) => (
            <label
              key={name}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-primary"
                {...register(name)}
                disabled={isPending}
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {isBlocked && (
          <div>
            <FormLabel htmlFor="blockedReason">Blocked Reason</FormLabel>
            <Input
              id="blockedReason"
              {...register("blockedReason")}
              placeholder="Reason for blocking this location"
              disabled={isPending}
            />
            <FormFieldError message={errors.blockedReason?.message} />
          </div>
        )}
      </section>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/locations")}
        submitLabel="Create Location"
      />
    </form>
  );
};
