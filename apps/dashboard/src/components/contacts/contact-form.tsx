"use client";

import { useContactSubmit } from "@/app/(dashboard)/contacts/use-contact-submit";
import {
  type AddressOption,
  type ContactCategoryOption,
  type LocationOption,
} from "@/app/(dashboard)/contacts/actions";
import { contactSalutations } from "@/lib/enums";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormError } from "@/components/ui/form-error";
import { AddressSelect } from "@/components/locations/address-select";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const salutationOptions = [
  { value: "", label: "—" },
  ...contactSalutations.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

type ContactFormProps = {
  addresses: AddressOption[];
  categories: ContactCategoryOption[];
  locations: LocationOption[];
};

export const ContactForm = ({ addresses, categories, locations }: ContactFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useContactSubmit();
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedCategories = watch("categoryUuids");

  useEffect(() => {
    if (state.success) router.push("/contacts");
  }, [state.success, router]);

  const toggleCategory = (uuid: string) => {
    const current = selectedCategories ?? [];
    setValue(
      "categoryUuids",
      current.includes(uuid) ? current.filter((c) => c !== uuid) : [...current, uuid],
    );
  };

  const locationOptions = [
    { value: "", label: "-empty-" },
    ...locations.map((l) => ({ value: l.uuid, label: l.name })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">

      {/* ── Identity ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Identity</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormSelectField
            control={control}
            id="salutation"
            name="salutation"
            label="Salutation"
            options={salutationOptions}
            emptyValue=""
            disabled={isPending}
          />

          <div>
            <FormLabel htmlFor="title">Title</FormLabel>
            <Input id="title" {...register("title")} placeholder="e.g. PhD" disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="initials">Initials</FormLabel>
            <Input id="initials" {...register("initials")} placeholder="e.g. J.D." disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="firstName">First Name</FormLabel>
            <Input id="firstName" {...register("firstName")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="lastName">Last Name</FormLabel>
            <Input id="lastName" {...register("lastName")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="fullName" required>Full Name</FormLabel>
            <Input
              id="fullName"
              {...register("fullName")}
              aria-invalid={!!errors.fullName}
              disabled={isPending}
            />
            <FormFieldError message={errors.fullName?.message} />
          </div>

          <div>
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input id="name" {...register("name")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="alternativeName">Alternative Name</FormLabel>
            <Input id="alternativeName" {...register("alternativeName")} disabled={isPending} />
          </div>
        </div>
      </section>

      {/* ── Contact Info ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Contact Info</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FormLabel htmlFor="telephone">Telephone</FormLabel>
            <Input id="telephone" {...register("telephone")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="mobile">Mobile</FormLabel>
            <Input id="mobile" {...register("mobile")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="fax">Fax</FormLabel>
            <Input id="fax" {...register("fax")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              disabled={isPending}
            />
            <FormFieldError message={errors.email?.message} />
          </div>

          <div>
            <FormLabel htmlFor="website">Website</FormLabel>
            <Input
              id="website"
              {...register("website")}
              aria-invalid={!!errors.website}
              placeholder="https://"
              disabled={isPending}
            />
            <FormFieldError message={errors.website?.message} />
          </div>
        </div>
      </section>

      {/* ── Linked Records ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Linked Records</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 lg:grid-cols-2">
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

          <FormSelectField
            control={control}
            id="locationUuid"
            name="locationUuid"
            label="Location"
            options={locationOptions}
            emptyValue=""
            disabled={isPending}
          />
        </div>
      </section>

      {/* ── Address ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Address</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FormLabel htmlFor="streetAndNumber">Street & Number</FormLabel>
            <Input id="streetAndNumber" {...register("streetAndNumber")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="house">House</FormLabel>
            <Input id="house" {...register("house")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="poBox">PO Box</FormLabel>
            <Input id="poBox" {...register("poBox")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
            <Input id="postalCode" {...register("postalCode")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="city">City</FormLabel>
            <Input id="city" {...register("city")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="region">Region</FormLabel>
            <Input id="region" {...register("region")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="country">Country</FormLabel>
            <Input id="country" {...register("country")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="annex">Annex</FormLabel>
            <Input id="annex" {...register("annex")} disabled={isPending} />
          </div>
        </div>
      </section>

      {/* ── Business ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Business</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FormLabel htmlFor="btwNumber">BTW Number</FormLabel>
            <Input id="btwNumber" {...register("btwNumber")} disabled={isPending} />
          </div>

          <div>
            <FormLabel htmlFor="sequenceNumber">Sequence Number</FormLabel>
            <Input
              id="sequenceNumber"
              type="number"
              min={0}
              {...register("sequenceNumber")}
              disabled={isPending}
            />
            <FormFieldError message={errors.sequenceNumber?.message as string | undefined} />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <FormLabel htmlFor="categoryAddition">Category Addition</FormLabel>
            <Input id="categoryAddition" {...register("categoryAddition")} disabled={isPending} />
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Categories</h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const checked = (selectedCategories ?? []).includes(cat.uuid);
              return (
                <label
                  key={cat.uuid}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                    checked={checked}
                    onChange={() => toggleCategory(cat.uuid)}
                    disabled={isPending}
                  />
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Other ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Other</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40 sm:w-fit">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-primary"
              {...register("isActive")}
              disabled={isPending}
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>

          <div>
            <FormLabel htmlFor="notes">Notes</FormLabel>
            <textarea
              id="notes"
              {...register("notes")}
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              placeholder="Any additional notes..."
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/contacts")}
        submitLabel="Create Contact"
      />
    </form>
  );
};
