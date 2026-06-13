"use client";

import { X, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { type LocationForTree } from "@/app/(dashboard)/locations/actions";
import { useSubLocationSubmit } from "@/app/(dashboard)/locations/use-sub-location-submit";
import { locationAdoptPositions, locationTypes } from "@/lib/enums";
import { LocationTreeDialog } from "@/components/locations/location-tree-dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type SubLocationFormProps = {
  /** All locations — any level can be picked as parent */
  locations: LocationForTree[];
};

export const SubLocationForm = ({ locations }: SubLocationFormProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [treeOpen, setTreeOpen] = useState(false);

  const { form, isPending, onSubmit, state } = useSubLocationSubmit();
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const isBlocked = watch("isBlocked");
  const adoptFrom = watch("adoptFrom");
  const adoptFromName = locations.find((l) => l.uuid === adoptFrom)?.name ?? "";

  useEffect(() => {
    if (state.success) {
      router.push("/locations");
    }
  }, [router, state.success]);

  const locationTypeOptions = locationTypes.map((lt) => ({
    value: lt,
    label: t(`location-form.location-type-options.${lt}`),
  }));

  const adoptPositionOptions = locationAdoptPositions.map((ap) => ({
    value: ap,
    label: t(`location-form.adopt-position-options.${ap}`),
  }));

  const flags = [
    { name: "isBlocked", label: t("location-form.flags.is-blocked") },
    { name: "blockedForOptimization", label: t("location-form.flags.blocked-for-optimization") },
    { name: "limitedDimensions", label: t("location-form.flags.limited-dimensions") },
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

          {/* Parent location — required, shows full tree */}
          <div className="lg:col-span-2">
            <FormLabel htmlFor="adoptFrom" required>
              {t("sub-location-form.fields.parent-location")}
            </FormLabel>
            <div className="flex gap-2">
              <Input
                id="adoptFrom"
                value={adoptFromName}
                readOnly
                placeholder={t("sub-location-form.placeholders.parent-location")}
                disabled={isPending}
                aria-invalid={!!errors.adoptFrom}
                className="flex-1 cursor-default"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setTreeOpen(true)}
                disabled={isPending}
              >
                <Search className="size-4" />
              </Button>
              {adoptFrom && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setValue("adoptFrom", "")}
                  disabled={isPending}
                >
                  <X className="size-4" />
                  <span className="sr-only">{t("common.cancel")}</span>
                </Button>
              )}
            </div>
            <FormFieldError message={errors.adoptFrom?.message} />
            {adoptFrom && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("location-form.adopt-from-address-inherited")}
              </p>
            )}
            <LocationTreeDialog
              locations={locations}
              open={treeOpen}
              onOpenChange={setTreeOpen}
              value={adoptFrom ?? ""}
              onConfirm={(uuid) => setValue("adoptFrom", uuid)}
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
        submitLabel={t("sub-location-form.submit")}
      />
    </form>
  );
};
