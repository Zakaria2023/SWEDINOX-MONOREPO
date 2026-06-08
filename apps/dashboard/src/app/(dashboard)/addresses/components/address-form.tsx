"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, type SelectOption } from "@/components/shadcn/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { cn } from "@/lib/helpers";
import { addressCategories, availableAtOptions } from "@/lib/enums";
import { getCompanyOptions } from "../../companies/actions";
import {
  getAddressById,
  type AddressActionResult,
  type AddressDetail,
} from "../actions";
import { useAddressSubmit } from "../hooks/use-address-submit";

type AddressFormProps = {
  addressId?: number;
  cancelLabel?: string;
  companyUuid?: string;
  lockCompany?: boolean;
  mode?: "add" | "edit";
  onCancel?: () => void;
  onSuccess?: (state: AddressActionResult) => void | Promise<void>;
  submitLabel?: string;
};

type LabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
};

type FieldErrorProps = {
  message?: string;
};

const Label = ({ children, htmlFor, required }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className="mb-1 block text-sm font-medium text-gray-700"
  >
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

const FieldError = ({ message }: FieldErrorProps) =>
  message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;

const CHECKBOX_CLASS = "h-4 w-4 rounded border-gray-300 accent-primary";
const EMPTY_SELECT_VALUE = "__none__";

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
  addressComplete: address.addressComplete ?? false,
  altName: address.altName ?? "",
  availableAt: address.availableAt ?? "",
  bundleSeparately: address.bundleSeparately ?? false,
  canopyRequired: address.canopyRequired ?? false,
  category: address.category,
  city: address.city ?? "",
  companyUuid: address.companyUuid,
  country: address.country ?? "",
  email: address.email ?? "",
  fax: address.fax ?? "",
  house: address.house ?? "",
  loadingInstructions: address.loadingInstructions ?? "",
  maxBundleWeight: address.maxBundleWeight ?? "",
  maxLength: address.maxLength ?? "",
  needCrane: address.needCrane ?? false,
  poBox: address.poBox ?? false,
  postalCode: address.postalCode ?? "",
  region: address.region ?? "",
  sequenceNumber:
    address.sequenceNumber === null ? "" : String(address.sequenceNumber),
  specialTransport: address.specialTransport ?? false,
  streetAndNo: address.streetAndNo ?? "",
  telephone: address.telephone ?? "",
  unloadingEndTime: address.unloadingEndTime ?? "",
  unloadingStartTime: address.unloadingStartTime ?? "",
  website: address.website ?? "",
});

export const AddressForm = ({
  addressId,
  cancelLabel = "Cancel",
  companyUuid,
  lockCompany = false,
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
  const {
    data: addressDetail,
    isLoading: isAddressLoading,
    isError: isAddressError,
  } = useQuery({
    queryKey: ["address", addressId],
    queryFn: () => getAddressById(addressId!),
    enabled: mode === "edit" && Boolean(addressId),
  });
  const {
    data: companyOptionsResult,
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
  } = useQuery({
    queryKey: ["company-options"],
    queryFn: () => getCompanyOptions(),
  });

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
    if (!addressDetail) {
      return;
    }

    reset(mapAddressToFormValues(addressDetail));
  }, [addressDetail, reset]);

  if (mode === "edit" && isAddressLoading) {
    return <p className="text-sm text-muted-foreground">Loading address...</p>;
  }

  if (mode === "edit" && (isAddressError || !addressDetail)) {
    return <ErrorMessage message="Address not found." />;
  }

  const categoryError =
    errors.category?.root?.message ??
    (errors.category as { message?: string } | undefined)?.message;
  const selectedCategories = watch("category") ?? [];
  const companyOptions: SelectOption[] = (companyOptionsResult?.data ?? []).map(
    (company) => ({
      label: company.companyName,
      value: company.uuid,
    }),
  );
  const selectedCompanyName =
    companyOptions.find((company) => company.value === watch("companyUuid"))
      ?.label ?? "";
  const companyErrorMessage =
    companyOptionsResult?.error ??
    (isCompaniesError ? "Failed to load companies." : "");
  const companyPlaceholder = isCompanyLocked
    ? isCompaniesLoading
      ? "Loading company..."
      : "Selected company"
    : isCompaniesLoading
      ? "Loading companies..."
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
            <Label htmlFor="companyUuid" required>
              Company
            </Label>
            <Controller
              control={control}
              name="companyUuid"
              render={({ field }) => (
                <Select
                  id="companyUuid"
                  name={field.name}
                  value={field.value || EMPTY_SELECT_VALUE}
                  options={companyOptions}
                  placeholder={companyPlaceholder}
                  invalid={!!errors.companyUuid}
                  disabled={
                    isCompanyLocked ||
                    isCompaniesLoading ||
                    companyOptions.length === 0
                  }
                  onValueChange={(value) =>
                    field.onChange(value === EMPTY_SELECT_VALUE ? "" : value)
                  }
                />
              )}
            />
            <FieldError message={errors.companyUuid?.message} />
            {companyErrorMessage ? (
              <FieldError message={companyErrorMessage} />
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
            <Label htmlFor="altName">Alternative Name</Label>
            <Input id="altName" {...register("altName")} />
          </div>
          <div>
            <Label htmlFor="sequenceNumber">Sequence Number</Label>
            <Input
              id="sequenceNumber"
              type="number"
              min={1}
              step={1}
              {...register("sequenceNumber")}
              aria-invalid={!!errors.sequenceNumber}
            />
            <FieldError message={errors.sequenceNumber?.message} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="poBox"
              {...register("poBox")}
              className={CHECKBOX_CLASS}
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
            <Label htmlFor="streetAndNo">Street & Number</Label>
            <Input id="streetAndNo" {...register("streetAndNo")} />
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input id="postalCode" {...register("postalCode")} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Input id="region" {...register("region")} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} />
          </div>
          <div>
            <Label htmlFor="house">House</Label>
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
            <Label htmlFor="telephone">Telephone</Label>
            <Input id="telephone" type="tel" {...register("telephone")} />
          </div>
          <div>
            <Label htmlFor="fax">Fax</Label>
            <Input id="fax" {...register("fax")} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              {...register("website")}
              aria-invalid={!!errors.website}
            />
            <FieldError message={errors.website?.message} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Logistics
        </h2>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="space-y-1">
              <Label required>Category</Label>
              <p className="text-sm text-muted-foreground">
                Choose how this address is used across the business flow.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {addressCategories.map((cat) => (
                <label
                  key={cat}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
                    selectedCategories.includes(cat)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-accent/40",
                  )}
                >
                  <input
                    type="checkbox"
                    value={cat}
                    {...register("category")}
                    className={`${CHECKBOX_CLASS} mt-0.5`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {formatOptionLabel(cat)}
                  </span>
                </label>
              ))}
            </div>
            <FieldError message={categoryError} />
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
                <label
                  key={name}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
                    watch(name)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-accent/40",
                  )}
                >
                  <input
                    type="checkbox"
                    {...register(name)}
                    className={`${CHECKBOX_CLASS} mt-0.5`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Unloading
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="availableAt">Available At</Label>
            <Controller
              control={control}
              name="availableAt"
              render={({ field }) => (
                <Select
                  id="availableAt"
                  name={field.name}
                  value={field.value || EMPTY_SELECT_VALUE}
                  options={AVAILABLE_AT_SELECT_OPTIONS}
                  onValueChange={(value) =>
                    field.onChange(value === EMPTY_SELECT_VALUE ? "" : value)
                  }
                />
              )}
            />
          </div>
          <div>
            <Label htmlFor="unloadingStartTime">Start Time</Label>
            <Controller
              control={control}
              name="unloadingStartTime"
              render={({ field }) => (
                <Select
                  id="unloadingStartTime"
                  name={field.name}
                  value={field.value || EMPTY_SELECT_VALUE}
                  options={TIME_SELECT_OPTIONS}
                  onValueChange={(value) =>
                    field.onChange(value === EMPTY_SELECT_VALUE ? "" : value)
                  }
                />
              )}
            />
          </div>
          <div>
            <Label htmlFor="unloadingEndTime">End Time</Label>
            <Controller
              control={control}
              name="unloadingEndTime"
              render={({ field }) => (
                <Select
                  id="unloadingEndTime"
                  name={field.name}
                  value={field.value || EMPTY_SELECT_VALUE}
                  options={TIME_SELECT_OPTIONS}
                  onValueChange={(value) =>
                    field.onChange(value === EMPTY_SELECT_VALUE ? "" : value)
                  }
                />
              )}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Constraints
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="maxLength">Max Length (m)</Label>
            <Input
              id="maxLength"
              type="number"
              step="0.01"
              min="0"
              {...register("maxLength")}
            />
          </div>
          <div>
            <Label htmlFor="maxBundleWeight">Max Bundle Weight (kg)</Label>
            <Input
              id="maxBundleWeight"
              type="number"
              step="0.01"
              min="0"
              {...register("maxBundleWeight")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="loadingInstructions">Loading Instructions</Label>
            <textarea
              id="loadingInstructions"
              {...register("loadingInstructions")}
              rows={4}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </section>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : (submitLabel ??
              (mode === "edit" ? "Save Changes" : "Create Address"))}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
};
