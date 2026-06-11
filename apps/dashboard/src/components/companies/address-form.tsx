"use client";

import { useRef } from "react";
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { type CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { Input } from "@/components/shadcn/input";
import { type SelectOption } from "@/components/shadcn/select";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { addressCategories, availableAtOptions } from "@/lib/enums";

type AddressFormProps = {
  control: Control<CompanyFormValues>;
  errors: FieldErrors<CompanyFormValues["address"]> | undefined;
  register: UseFormRegister<CompanyFormValues>;
  watch: UseFormWatch<CompanyFormValues>;
  deliveryOnly?: boolean;
};

const EMPTY_SELECT_VALUE = "none";

const BOOLEAN_FIELDS = [
  { name: "needCrane", labelKey: "address-form.boolean-fields.need-crane" },
  {
    name: "canopyRequired",
    labelKey: "address-form.boolean-fields.canopy-required",
  },
  {
    name: "bundleSeparately",
    labelKey: "address-form.boolean-fields.bundle-separately",
  },
  {
    name: "addressComplete",
    labelKey: "address-form.boolean-fields.address-complete",
  },
  {
    name: "specialTransport",
    labelKey: "address-form.boolean-fields.special-transport",
  },
] as const;

export const AddressForm = ({
  control,
  errors,
  register,
  watch,
  deliveryOnly = false,
}: AddressFormProps) => {
  const { t } = useTranslation();
  const peppolPrevLengthRef = useRef(0);

  const selectedCategories = watch("address.category") ?? [];
  const showBillingSettings = selectedCategories.includes("invoice");
  const showDeliverySettings = deliveryOnly || selectedCategories.includes("delivery");
  const visibleCategories: Array<(typeof addressCategories)[number]> = deliveryOnly
    ? ["delivery"]
    : [...addressCategories];

  const categoryError =
    errors?.category?.root?.message ??
    (errors?.category as { message?: string } | undefined)?.message;

  const availableAtOptionsForSelect: SelectOption[] = [
    { label: t("common.none"), value: EMPTY_SELECT_VALUE },
    ...availableAtOptions.map((option) => ({
      label: t(`address-form.available-at-options.${option}`),
      value: option,
    })),
  ];

  const timeSelectOptions: SelectOption[] = [
    { label: t("common.none"), value: EMPTY_SELECT_VALUE },
    ...Array.from({ length: 48 }, (_, index) => {
      const hours = String(Math.floor(index / 2)).padStart(2, "0");
      const minutes = index % 2 === 0 ? "00" : "30";
      const value = `${hours}:${minutes}`;
      return { label: value, value };
    }),
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("address-form.sections.basic-info")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="altName">
              {t("address-form.fields.alt-name")}
            </FormLabel>
            <Input id="altName" {...register("address.altName")} />
          </div>
          <div>
            <FormLabel htmlFor="sequenceNumber">
              {t("address-form.fields.sequence-number")}
            </FormLabel>
            <Input
              id="sequenceNumber"
              type="number"
              min={1}
              step={1}
              {...register("address.sequenceNumber")}
              aria-invalid={!!errors?.sequenceNumber}
            />
            <FormFieldError message={errors?.sequenceNumber?.message} />
          </div>
          <div>
            <FormLabel htmlFor="gln">{t("address-form.fields.gln")}</FormLabel>
            <Input
              id="gln"
              maxLength={13}
              placeholder={t("address-form.placeholders.gln")}
              {...register("address.gln")}
              aria-invalid={!!errors?.gln}
            />
            <FormFieldError message={errors?.gln?.message} />
          </div>
          <div>
            <FormLabel htmlFor="peppolId">
              {t("address-form.fields.peppol-id")}
            </FormLabel>
            <Controller
              control={control}
              name="address.peppolId"
              render={({ field }) => (
                <Input
                  id="peppolId"
                  placeholder={t("address-form.placeholders.peppol-id")}
                  value={field.value ?? ""}
                  aria-invalid={!!errors?.peppolId}
                  onChange={(event) => {
                    const raw = event.target.value;
                    const isDeleting = raw.length < peppolPrevLengthRef.current;
                    peppolPrevLengthRef.current = raw.length;

                    if (!isDeleting && /^\d{4}$/.test(raw)) {
                      field.onChange(`${raw}:`);
                      return;
                    }

                    field.onChange(raw);
                  }}
                  onBlur={field.onBlur}
                />
              )}
            />
            <FormFieldError message={errors?.peppolId?.message} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="poBox"
              {...register("address.poBox")}
              className="h-4 w-4 rounded border-gray-300 accent-primary"
            />
            <label htmlFor="poBox" className="text-sm text-gray-700">
              {t("address-form.fields.po-box")}
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("address-form.sections.address")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormLabel htmlFor="streetAndNo">
              {t("address-form.fields.street-and-number")}
            </FormLabel>
            <Input id="streetAndNo" {...register("address.streetAndNo")} />
          </div>
          <div>
            <FormLabel htmlFor="postalCode">
              {t("address-form.fields.postal-code")}
            </FormLabel>
            <Input id="postalCode" {...register("address.postalCode")} />
          </div>
          <div>
            <FormLabel htmlFor="city">{t("address-form.fields.city")}</FormLabel>
            <Input id="city" {...register("address.city")} />
          </div>
          <div>
            <FormLabel htmlFor="region">
              {t("address-form.fields.region")}
            </FormLabel>
            <Input id="region" {...register("address.region")} />
          </div>
          <div>
            <FormLabel htmlFor="country">
              {t("address-form.fields.country")}
            </FormLabel>
            <Input id="country" {...register("address.country")} />
          </div>
          <div>
            <FormLabel htmlFor="house">{t("address-form.fields.house")}</FormLabel>
            <Input id="house" {...register("address.house")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("address-form.sections.contact")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="telephone">
              {t("address-form.fields.telephone")}
            </FormLabel>
            <Input id="telephone" type="tel" {...register("address.telephone")} />
          </div>
          <div>
            <FormLabel htmlFor="fax">{t("address-form.fields.fax")}</FormLabel>
            <Input id="fax" {...register("address.fax")} />
          </div>
          <div>
            <FormLabel htmlFor="email">{t("address-form.fields.email")}</FormLabel>
            <Input
              id="email"
              type="email"
              {...register("address.email")}
              aria-invalid={!!errors?.email}
            />
            <FormFieldError message={errors?.email?.message} />
          </div>
          <div>
            <FormLabel htmlFor="website">
              {t("address-form.fields.website")}
            </FormLabel>
            <Input
              id="website"
              type="url"
              {...register("address.website")}
              aria-invalid={!!errors?.website}
            />
            <FormFieldError message={errors?.website?.message} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("address-form.sections.category")}
        </h2>
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="space-y-1">
            <FormLabel required>{t("address-form.fields.category")}</FormLabel>
            <p className="text-sm text-muted-foreground">
              {t("address-form.category-description")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleCategories.map((category) => (
              <FormCheckboxCard
                key={category}
                active={selectedCategories.includes(category)}
                label={t(`address-form.categories.${category}`)}
                value={category}
                {...register("address.category")}
              />
            ))}
          </div>
          <FormFieldError message={categoryError} />
        </div>
      </section>

      {showBillingSettings && (
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            {t("address-form.sections.billing-address-settings")}
          </h2>
          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div>
              <FormLabel htmlFor="billingAttention">
                {t("address-form.fields.billing-attention")}
              </FormLabel>
              <Input
                id="billingAttention"
                {...register("address.billingAttention")}
              />
            </div>
            <div>
              <Input
                id="billingAttentionAdditional"
                {...register("address.billingAttentionAdditional")}
                placeholder={t("address-form.placeholders.billing-attention-additional")}
              />
            </div>
          </div>
        </section>
      )}

      {showDeliverySettings && (
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            {t("address-form.sections.delivery-address-settings")}
          </h2>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelectField
                  control={control}
                  id="unloadingStartTime"
                  label={t("address-form.fields.unloading-start-time")}
                  name="address.unloadingStartTime"
                  options={timeSelectOptions}
                  emptyValue={EMPTY_SELECT_VALUE}
                />
                <FormSelectField
                  control={control}
                  id="unloadingEndTime"
                  label={t("address-form.fields.unloading-end-time")}
                  name="address.unloadingEndTime"
                  options={timeSelectOptions}
                  emptyValue={EMPTY_SELECT_VALUE}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FormLabel htmlFor="maxLength">
                    {t("address-form.fields.max-length")}
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxLength"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("address.maxLength")}
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("address-form.units.mm")}
                    </span>
                  </div>
                </div>
                <div>
                  <FormLabel htmlFor="maxBundleWeight">
                    {t("address-form.fields.max-bundle-weight")}
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxBundleWeight"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("address.maxBundleWeight")}
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("address-form.units.kg")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <FormLabel htmlFor="loadingInstructions">
                  {t("address-form.fields.loading-instructions")}
                </FormLabel>
                <textarea
                  id="loadingInstructions"
                  {...register("address.loadingInstructions")}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <FormSelectField
                control={control}
                id="availableAt"
                label={t("address-form.fields.available-at")}
                name="address.availableAt"
                options={availableAtOptionsForSelect}
                emptyValue={EMPTY_SELECT_VALUE}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  {t("address-form.sections.handling-options")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("address-form.handling-options-description")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {BOOLEAN_FIELDS.map(({ name, labelKey }) => (
                  <FormCheckboxCard
                    key={name}
                    active={watch(`address.${name}`)}
                    label={t(labelKey)}
                    {...register(`address.${name}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
