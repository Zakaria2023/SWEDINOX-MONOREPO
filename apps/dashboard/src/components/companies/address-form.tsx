"use client";

import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  addressCategories,
  AddressCategory,
  availableAtOptions,
} from "@/lib/enums";
import { ADDRESS_CATEGORY_LABELS, AVAILABLE_AT_LABELS } from "@/lib/labels";
import { useRef } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";

type AddressFormProps = {
  control: Control<CompanyFormValues>;
  errors: FieldErrors<CompanyFormValues["address"]> | undefined;
  register: UseFormRegister<CompanyFormValues>;
  watch: UseFormWatch<CompanyFormValues>;
  availableCategories?: AddressCategory[];
};

const EMPTY_SELECT_VALUE = "none";

const BOOLEAN_FIELDS = [
  { name: "needCrane", label: "Need Crane" },
  {
    name: "canopyRequired",
    label: "Canopy Required",
  },
  {
    name: "bundleSeparately",
    label: "Bundle Separately",
  },
  {
    name: "addressComplete",
    label: "Address Complete",
  },
  {
    name: "specialTransport",
    label: "Special Transport",
  },
] as const;

export const AddressForm = ({
  control,
  errors,
  register,
  watch,
  availableCategories,
}: AddressFormProps) => {
  const peppolPrevLengthRef = useRef(0);

  const selectedCategories = watch("address.category") ?? [];
  const showBillingSettings = selectedCategories.includes("invoice");
  const showDeliverySettings = selectedCategories.includes("delivery");
  const visibleCategories: AddressCategory[] = availableCategories ?? [
    ...addressCategories,
  ];

  const categoryError =
    errors?.category?.root?.message ??
    (errors?.category as { message?: string } | undefined)?.message;

  const availableAtOptionsForSelect: SelectOption[] = [
    { label: "None", value: EMPTY_SELECT_VALUE },
    ...availableAtOptions.map((option) => ({
      label: AVAILABLE_AT_LABELS[option],
      value: option,
    })),
  ];

  const timeSelectOptions: SelectOption[] = [
    { label: "None", value: EMPTY_SELECT_VALUE },
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
          Basic Info
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="altName">Alternative Name</FormLabel>
            <Input id="altName" {...register("address.altName")} />
          </div>
          <div>
            <FormLabel htmlFor="sequenceNumber">Sequence Number</FormLabel>
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
            <FormLabel htmlFor="gln">GLN</FormLabel>
            <Input
              id="gln"
              maxLength={13}
              placeholder="1234567890123"
              {...register("address.gln")}
              aria-invalid={!!errors?.gln}
            />
            <FormFieldError message={errors?.gln?.message} />
          </div>
          <div>
            <FormLabel htmlFor="peppolId">Peppol ID</FormLabel>
            <Controller
              control={control}
              name="address.peppolId"
              render={({ field }) => (
                <Input
                  id="peppolId"
                  placeholder="1204:identifier"
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
              PO Box
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Address
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormLabel htmlFor="streetAndNo">Street & Number</FormLabel>
            <Input id="streetAndNo" {...register("address.streetAndNo")} />
          </div>
          <div>
            <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
            <Input id="postalCode" {...register("address.postalCode")} />
          </div>
          <div>
            <FormLabel htmlFor="city">City</FormLabel>
            <Input id="city" {...register("address.city")} />
          </div>
          <div>
            <FormLabel htmlFor="region">Region</FormLabel>
            <Input id="region" {...register("address.region")} />
          </div>
          <div>
            <FormLabel htmlFor="country">Country</FormLabel>
            <Input id="country" {...register("address.country")} />
          </div>
          <div>
            <FormLabel htmlFor="house">House</FormLabel>
            <Input id="house" {...register("address.house")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Contact
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="telephone">Telephone</FormLabel>
            <Input
              id="telephone"
              type="tel"
              {...register("address.telephone")}
            />
          </div>
          <div>
            <FormLabel htmlFor="fax">Fax</FormLabel>
            <Input id="fax" {...register("address.fax")} />
          </div>
          <div>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              id="email"
              type="email"
              {...register("address.email")}
              aria-invalid={!!errors?.email}
            />
            <FormFieldError message={errors?.email?.message} />
          </div>
          <div>
            <FormLabel htmlFor="website">Website</FormLabel>
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
          Category
        </h2>
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="space-y-1">
            <FormLabel required>Category</FormLabel>
            <p className="text-sm text-muted-foreground">
              Choose how this address is used across the business flow.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleCategories.map((category) => (
              <FormCheckboxCard
                key={category}
                active={selectedCategories.includes(category)}
                label={ADDRESS_CATEGORY_LABELS[category]}
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
            Billing Address Settings
          </h2>
          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div>
              <FormLabel htmlFor="billingAttention">
                To the Attention Of
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
                placeholder="Additional billing line"
              />
            </div>
          </div>
        </section>
      )}

      {showDeliverySettings && (
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Delivery Address Settings
          </h2>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelectField
                  control={control}
                  id="unloadingStartTime"
                  label="Unloading Start Time"
                  name="address.unloadingStartTime"
                  options={timeSelectOptions}
                  emptyValue={EMPTY_SELECT_VALUE}
                />
                <FormSelectField
                  control={control}
                  id="unloadingEndTime"
                  label="Unloading End Time"
                  name="address.unloadingEndTime"
                  options={timeSelectOptions}
                  emptyValue={EMPTY_SELECT_VALUE}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FormLabel htmlFor="maxLength">Max Length</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxLength"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("address.maxLength")}
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                </div>
                <div>
                  <FormLabel htmlFor="maxBundleWeight">
                    Max Bundle Weight
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxBundleWeight"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("address.maxBundleWeight")}
                    />
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                </div>
              </div>

              <div>
                <FormLabel htmlFor="loadingInstructions">
                  Loading Instructions
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
                label="Available At"
                name="address.availableAt"
                options={availableAtOptionsForSelect}
                emptyValue={EMPTY_SELECT_VALUE}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  Handling Options
                </h3>
                <p className="text-sm text-muted-foreground">
                  Mark any special delivery or unloading requirements.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {BOOLEAN_FIELDS.map(({ name, label }) => (
                  <FormCheckboxCard
                    key={name}
                    active={watch(`address.${name}`)}
                    label={label}
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
