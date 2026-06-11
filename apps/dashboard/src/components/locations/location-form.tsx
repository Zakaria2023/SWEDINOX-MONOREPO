"use client";

import { X } from "lucide-react";
import { Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { type AddressSelectOption } from "@/app/(dashboard)/addresses/actions";
import { type LoadingLocationOption } from "@/app/(dashboard)/locations/actions";
import { useLocationSubmit } from "@/app/(dashboard)/locations/use-location-submit";
import { locationAdoptPositions, locationTypes } from "@/lib/enums";
import { AddressSelect } from "@/components/locations/address-select";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

const ADD_NEW_VALUE = "__add_new__";

type LocationFormProps = {
  loadingLocations: LoadingLocationOption[];
  addresses: AddressSelectOption[];
};

export const LocationForm = ({ loadingLocations, addresses }: LocationFormProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [pendingLoadingLocationName, setPendingLoadingLocationName] = useState("");
  const [isAddingNewLoadingLocation, setIsAddingNewLoadingLocation] = useState(false);

  const { form, isPending, onSubmit, state } = useLocationSubmit(
    isAddingNewLoadingLocation ? pendingLoadingLocationName : undefined,
  );
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const isBlocked = watch("isBlocked");

  useEffect(() => {
    if (state.success) {
      router.push("/locations");
    }
  }, [router, state.success]);

  const loadingLocationOptions = [
    { value: "", label: t("common.empty-option") },
    ...loadingLocations.map((loadingLocation) => ({
      value: loadingLocation.uuid,
      label: loadingLocation.name,
    })),
    { value: ADD_NEW_VALUE, label: t("location-form.add-new-loading-location") },
  ];

  const locationTypeOptions = locationTypes.map((locationType) => ({
    value: locationType,
    label: t(`location-form.location-type-options.${locationType}`),
  }));

  const adoptPositionOptions = locationAdoptPositions.map((adoptPosition) => ({
    value: adoptPosition,
    label: t(`location-form.adopt-position-options.${adoptPosition}`),
  }));

  const flags = [
    { name: "isBlocked", label: t("location-form.flags.is-blocked") },
    {
      name: "blockedForOptimization",
      label: t("location-form.flags.blocked-for-optimization"),
    },
    {
      name: "limitedDimensions",
      label: t("location-form.flags.limited-dimensions"),
    },
  ] as const;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("location-form.sections.location-details")}
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 lg:grid-cols-2">
          <div>
            <FormLabel htmlFor="name" required>
              {t("location-form.fields.name")}
            </FormLabel>
            <Input
              id="name"
              {...register("name")}
              aria-invalid={!!errors.name}
              placeholder={t("location-form.placeholders.name")}
              disabled={isPending}
            />
            <FormFieldError message={errors.name?.message} />
          </div>

          <FormSelectField
            control={control}
            id="locationType"
            name="locationType"
            label={t("location-form.fields.location-type")}
            required
            options={locationTypeOptions}
            placeholder={t("location-form.placeholders.select-type")}
            errorMessage={errors.locationType?.message}
            invalid={!!errors.locationType}
            disabled={isPending}
          />

          <div>
            <FormSelectField
              control={control}
              id="loadingLocationUuid"
              name="loadingLocationUuid"
              label={t("location-form.fields.loading-location")}
              options={loadingLocationOptions}
              emptyValue=""
              disabled={isPending}
              onValueChange={(value, fieldOnChange) => {
                if (value === ADD_NEW_VALUE) {
                  setIsAddingNewLoadingLocation(true);
                  fieldOnChange(ADD_NEW_VALUE);
                  return;
                }

                setIsAddingNewLoadingLocation(false);
                setPendingLoadingLocationName("");
                fieldOnChange(value);
              }}
            />
            {isAddingNewLoadingLocation && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  placeholder={t("location-form.placeholders.new-loading-location-name")}
                  value={pendingLoadingLocationName}
                  onChange={(event) => setPendingLoadingLocationName(event.target.value)}
                  disabled={isPending}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewLoadingLocation(false);
                    setPendingLoadingLocationName("");
                    setValue("loadingLocationUuid", "");
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  disabled={isPending}
                >
                  <X className="size-4" />
                  <span className="sr-only">{t("location-form.cancel-new-loading-location")}</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <FormLabel htmlFor="addressUuid">
              {t("location-form.fields.address")}
            </FormLabel>
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
            <FormLabel htmlFor="pickingSequence">
              {t("location-form.fields.picking-sequence")}
            </FormLabel>
            <Input
              id="pickingSequence"
              type="number"
              min={0}
              {...register("pickingSequence")}
              aria-invalid={!!errors.pickingSequence}
              placeholder={t("location-form.placeholders.picking-sequence")}
              disabled={isPending}
            />
            <FormFieldError message={errors.pickingSequence?.message as string | undefined} />
          </div>

          <div>
            <FormLabel htmlFor="adoptFrom">
              {t("location-form.fields.adopt-from")}
            </FormLabel>
            <Input
              id="adoptFrom"
              {...register("adoptFrom")}
              placeholder={t("location-form.placeholders.adopt-from")}
              disabled={isPending}
            />
          </div>

          <FormSelectField
            control={control}
            id="adoptPosition"
            name="adoptPosition"
            label={t("location-form.fields.adopt-position")}
            options={adoptPositionOptions}
            disabled={isPending}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("location-form.sections.flags")}
        </h2>
        <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {flags.map((flag) => (
            <label
              key={flag.name}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-primary"
                {...register(flag.name)}
                disabled={isPending}
              />
              <span className="text-sm font-medium text-gray-700">{flag.label}</span>
            </label>
          ))}
        </div>

        {isBlocked && (
          <div>
            <FormLabel htmlFor="blockedReason">
              {t("location-form.fields.blocked-reason")}
            </FormLabel>
            <Input
              id="blockedReason"
              {...register("blockedReason")}
              placeholder={t("location-form.placeholders.blocked-reason")}
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
        submitLabel={t("location-form.submit")}
      />
    </form>
  );
};
