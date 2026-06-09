"use client";

import {
  type AddressActionResult,
  type AddressDetail,
} from "@/app/(dashboard)/addresses/actions";
import { useAddressSubmit } from "@/app/(dashboard)/addresses/use-address-submit";
import { Input } from "@/components/shadcn/input";
import { type SelectOption } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { ErrorMessage } from "@/components/ui/error-message";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { addressCategories, availableAtOptions } from "@/lib/enums";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormError } from "../ui/form-error";

type AddressFormProps = {
  addressId?: number;
  cancelLabel?: string;
  companyOptions?: SelectOption[];
  companyOptionsError?: string;
  companyUuid?: string;
  initialAddress?: AddressDetail | null;
  lockCompany?: boolean;
  lockedCompanyName?: string;
  mode?: "add" | "edit";
  onCancel?: () => void;
  onSuccess?: (state: AddressActionResult) => void | Promise<void>;
  submitLabel?: string;
};

const EMPTY_SELECT_VALUE = "none";

const formatOptionLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const AVAILABLE_AT_SELECT_OPTIONS: SelectOption[] = [
  { label: "None", value: EMPTY_SELECT_VALUE },
  ...availableAtOptions.map((option) => ({
    label: formatOptionLabel(option),
    value: option,
  })),
];

const TIME_SELECT_OPTIONS: SelectOption[] = [
  { label: "None", value: EMPTY_SELECT_VALUE },
  ...Array.from({ length: 48 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, "0");
    const minutes = index % 2 === 0 ? "00" : "30";
    const value = `${hours}:${minutes}`;

    return { label: value, value };
  }),
];

const BOOLEAN_FIELDS = [
  { name: "needCrane", label: "Need Crane" },
  { name: "canopyRequired", label: "Canopy Required" },
  { name: "bundleSeparately", label: "Bundle Separately" },
  { name: "addressComplete", label: "Address Complete" },
  { name: "specialTransport", label: "Special Transport" },
] as const;

const mapAddressToFormValues = (address: AddressDetail) => ({
  addressComplete: address.CompanyAddresses.addressComplete ?? false,
  altName: address.CompanyAddresses.altName ?? "",
  availableAt: address.CompanyAddresses.availableAt ?? "",
  billingAttention: address.CompanyAddresses.billingAttention ?? "",
  billingAttentionAdditional:
    address.CompanyAddresses.billingAttentionAdditional ?? "",
  bundleSeparately: address.CompanyAddresses.bundleSeparately ?? false,
  canopyRequired: address.CompanyAddresses.canopyRequired ?? false,
  category: address.CompanyAddresses.category,
  city: address.CompanyAddresses.city ?? "",
  companyUuid: address.CompanyAddresses.companyUuid,
  country: address.CompanyAddresses.country ?? "",
  email: address.CompanyAddresses.email ?? "",
  fax: address.CompanyAddresses.fax ?? "",
  house: address.CompanyAddresses.house ?? "",
  loadingInstructions: address.CompanyAddresses.loadingInstructions ?? "",
  maxBundleWeight: address.CompanyAddresses.maxBundleWeight ?? "",
  maxLength: address.CompanyAddresses.maxLength ?? "",
  needCrane: address.CompanyAddresses.needCrane ?? false,
  poBox: address.CompanyAddresses.poBox ?? false,
  postalCode: address.CompanyAddresses.postalCode ?? "",
  region: address.CompanyAddresses.region ?? "",
  sequenceNumber:
    address.CompanyAddresses.sequenceNumber === null
      ? ""
      : String(address.CompanyAddresses.sequenceNumber),
  specialTransport: address.CompanyAddresses.specialTransport ?? false,
  streetAndNo: address.CompanyAddresses.streetAndNo ?? "",
  telephone: address.CompanyAddresses.telephone ?? "",
  unloadingEndTime: address.CompanyAddresses.unloadingEndTime ?? "",
  unloadingStartTime: address.CompanyAddresses.unloadingStartTime ?? "",
  website: address.CompanyAddresses.website ?? "",
});

export const AddressForm = ({
  addressId,
  cancelLabel = "Cancel",
  companyOptions = [],
  companyOptionsError,
  companyUuid,
  initialAddress,
  lockCompany = false,
  lockedCompanyName,
  mode = "add",
  onCancel,
  onSuccess,
  submitLabel,
}: AddressFormProps) => {
  const router = useRouter();
  const isCompanyLocked = lockCompany && Boolean(companyUuid);
  const { form, onSubmit, isPending, state } = useAddressSubmit({
    addressId,
    companyUuid,
    mode,
    onSuccess,
  });
  const {
    control,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!companyUuid) {
      return;
    }

    setValue("companyUuid", companyUuid, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [companyUuid, setValue]);

  useEffect(() => {
    if (!initialAddress) {
      return;
    }

    reset(mapAddressToFormValues(initialAddress));
  }, [initialAddress, reset]);

  if (mode === "edit" && !initialAddress) {
    return <ErrorMessage message="Address not found." />;
  }

  const categoryError =
    errors.category?.root?.message ??
    (errors.category as { message?: string } | undefined)?.message;
  const selectedCategories = watch("category") ?? [];
  const showBillingSettings = selectedCategories.includes("invoice");
  const showDeliverySettings = selectedCategories.includes("delivery");
  const selectedCompanyUuid = watch("companyUuid");
  const selectedCompanyName =
    companyOptions.find((company) => company.value === selectedCompanyUuid)
      ?.label ??
    lockedCompanyName ??
    initialAddress?.Companies?.companyName ??
    "";
  const companyErrorMessage = companyOptionsError ?? "";
  const companyPlaceholder = isCompanyLocked
    ? "Selected company"
    : companyOptions.length > 0
      ? "Select a company"
      : "No companies available";

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    router.push("/addresses");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Basic Info
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            {isCompanyLocked ? (
              <>
                <FormLabel htmlFor="companyUuid" required>
                  Company
                </FormLabel>
                <Input
                  id="companyUuid"
                  value={selectedCompanyName}
                  placeholder={companyPlaceholder}
                  readOnly
                  disabled
                />
              </>
            ) : (
              <FormSelectField
                control={control}
                id="companyUuid"
                invalid={!!errors.companyUuid}
                label="Company"
                name="companyUuid"
                options={companyOptions}
                placeholder={companyPlaceholder}
                required
                disabled={companyOptions.length === 0}
                emptyValue={EMPTY_SELECT_VALUE}
                errorMessage={errors.companyUuid?.message}
              />
            )}
            {companyErrorMessage ? (
              <FormFieldError message={companyErrorMessage} />
            ) : isCompanyLocked ? (
              <p className="mt-1 text-sm text-muted-foreground">
                This address will be linked to{" "}
                <span className="font-medium text-foreground">
                  {selectedCompanyName || "the selected company"}
                </span>
                .
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Don&apos;t see the company? Create it first in{" "}
                <Link href="/companies" className="font-medium text-primary">
                  Companies
                </Link>
                .
              </p>
            )}
          </div>
          <div>
            <FormLabel htmlFor="altName">Alternative Name</FormLabel>
            <Input id="altName" {...register("altName")} />
          </div>
          <div>
            <FormLabel htmlFor="sequenceNumber">Sequence Number</FormLabel>
            <Input
              id="sequenceNumber"
              type="number"
              min={1}
              step={1}
              {...register("sequenceNumber")}
              aria-invalid={!!errors.sequenceNumber}
            />
            <FormFieldError message={errors.sequenceNumber?.message} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="poBox"
              {...register("poBox")}
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
            <Input id="streetAndNo" {...register("streetAndNo")} />
          </div>
          <div>
            <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
            <Input id="postalCode" {...register("postalCode")} />
          </div>
          <div>
            <FormLabel htmlFor="city">City</FormLabel>
            <Input id="city" {...register("city")} />
          </div>
          <div>
            <FormLabel htmlFor="region">Region</FormLabel>
            <Input id="region" {...register("region")} />
          </div>
          <div>
            <FormLabel htmlFor="country">Country</FormLabel>
            <Input id="country" {...register("country")} />
          </div>
          <div>
            <FormLabel htmlFor="house">House</FormLabel>
            <Input id="house" {...register("house")} />
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
            <Input id="telephone" type="tel" {...register("telephone")} />
          </div>
          <div>
            <FormLabel htmlFor="fax">Fax</FormLabel>
            <Input id="fax" {...register("fax")} />
          </div>
          <div>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            <FormFieldError message={errors.email?.message} />
          </div>
          <div>
            <FormLabel htmlFor="website">Website</FormLabel>
            <Input
              id="website"
              type="url"
              {...register("website")}
              aria-invalid={!!errors.website}
            />
            <FormFieldError message={errors.website?.message} />
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
            {addressCategories.map((cat) => (
              <FormCheckboxCard
                key={cat}
                active={selectedCategories.includes(cat)}
                label={formatOptionLabel(cat)}
                value={cat}
                {...register("category")}
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
                To The Attention Of
              </FormLabel>
              <Input id="billingAttention" {...register("billingAttention")} />
            </div>
            <div>
              <Input
                id="billingAttentionAdditional"
                {...register("billingAttentionAdditional")}
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
                  name="unloadingStartTime"
                  options={TIME_SELECT_OPTIONS}
                  emptyValue={EMPTY_SELECT_VALUE}
                />
                <FormSelectField
                  control={control}
                  id="unloadingEndTime"
                  label="Unloading End Time"
                  name="unloadingEndTime"
                  options={TIME_SELECT_OPTIONS}
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
                      {...register("maxLength")}
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
                      {...register("maxBundleWeight")}
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
                  {...register("loadingInstructions")}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <FormSelectField
                control={control}
                id="availableAt"
                label="Available At"
                name="availableAt"
                options={AVAILABLE_AT_SELECT_OPTIONS}
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
                    active={watch(name)}
                    label={label}
                    {...register(name)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <FormError>{state.error}</FormError>

      <FormActions
        cancelLabel={cancelLabel}
        isPending={isPending}
        onCancel={handleCancel}
        submitLabel={
          submitLabel ?? (mode === "edit" ? "Save Changes" : "Create Address")
        }
      />
    </form>
  );
};
