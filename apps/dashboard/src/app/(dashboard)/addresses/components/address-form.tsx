"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { addressCategories, availableAtOptions } from "@/lib/enums";
import { useAddressSubmit } from "../hooks/use-address-submit";

type LabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
};

const Label = ({ children, htmlFor, required }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

type FieldErrorProps = {
  message?: string;
};

const FieldError = ({ message }: FieldErrorProps) =>
  message ? <p className="text-sm text-red-600 mt-1">{message}</p> : null;

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const CHECKBOX_CLASS = "h-4 w-4 rounded border-gray-300 accent-primary";

const BOOLEAN_FIELDS = [
  { name: "needCrane", label: "Need Crane" },
  { name: "canopyRequired", label: "Canopy Required" },
  { name: "bundleSeparately", label: "Bundle Separately" },
  { name: "addressComplete", label: "Address Complete" },
  { name: "specialTransport", label: "Special Transport" },
] as const;

export const AddressForm = () => {
  const router = useRouter();
  const { form, onSubmit, isPending, state } = useAddressSubmit();
  const {
    register,
    formState: { errors },
  } = form;

  const categoryError =
    errors.category?.root?.message ??
    (errors.category as { message?: string } | undefined)?.message;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Basic Info
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="companyUuid" required>
              Company UUID
            </Label>
            <Input
              id="companyUuid"
              {...register("companyUuid")}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              aria-invalid={!!errors.companyUuid}
            />
            <FieldError message={errors.companyUuid?.message} />
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

      {/* Address */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
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

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
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

      {/* Logistics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Logistics
        </h2>
        <div>
          <Label required>Category</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {addressCategories.map((cat) => (
              <label key={cat} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={cat}
                  {...register("category")}
                  className={CHECKBOX_CLASS}
                />
                <span className="text-sm text-gray-700 capitalize">{cat}</span>
              </label>
            ))}
          </div>
          <FieldError message={categoryError} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BOOLEAN_FIELDS.map(({ name, label }) => (
            <label key={name} className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register(name)}
                className={CHECKBOX_CLASS}
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Unloading */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Unloading
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="availableAt">Available At</Label>
            <select
              id="availableAt"
              {...register("availableAt")}
              className={SELECT_CLASS}
            >
              <option value="">None</option>
              {availableAtOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="unloadingStartTime">Start Time</Label>
            <Input
              id="unloadingStartTime"
              type="time"
              {...register("unloadingStartTime")}
            />
          </div>
          <div>
            <Label htmlFor="unloadingEndTime">End Time</Label>
            <Input
              id="unloadingEndTime"
              type="time"
              {...register("unloadingEndTime")}
            />
          </div>
        </div>
      </section>

      {/* Constraints */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
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
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-y"
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
          {isPending ? "Saving..." : "Create Address"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/addresses")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
