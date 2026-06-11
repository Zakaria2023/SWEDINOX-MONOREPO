"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { useContactSubmit } from "@/app/(dashboard)/contacts/use-contact-submit";
import { type ContactGroupOption } from "@/app/(dashboard)/contacts/actions";
import { contactTypes } from "@/lib/enums";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { DatePicker } from "@/components/shadcn/date-picker";
import { FormActions } from "@/components/ui/form-actions";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormError } from "@/components/ui/form-error";

const CONTACT_TYPE_LABELS: Record<string, string> = {
  gross_prices: "Gross prices",
  options: "Options",
  net_prices: "Net prices",
  cost_price: "Cost price",
  surcharges: "Surcharges",
  toeslagen: "Toeslagen",
};

type ContactFormProps = {
  groups: ContactGroupOption[];
};

export const ContactForm = ({ groups }: ContactFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useContactSubmit();
  const { register, watch, setValue, control, formState: { errors } } = form;

  const contactType = watch("contactType");
  const hasPriceDate = watch("hasPriceDate");

  useEffect(() => {
    if (state.success) router.push("/contacts");
  }, [state.success, router]);

  const groupOptions = [
    { value: "", label: "-empty-" },
    ...groups.map((g) => ({ value: g.uuid, label: g.name })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr_200px_200px]">

        {/* ── Contact type ─────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Contact type
          </h2>
          <div className="space-y-2">
            {contactTypes.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  className="size-4 accent-primary"
                  checked={contactType === type}
                  onChange={() => setValue("contactType", type)}
                  disabled={isPending}
                />
                <span className="text-sm text-gray-700">{CONTACT_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ── Contact ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Contact
          </h2>
          <div className="grid gap-4">
            <div>
              <FormLabel htmlFor="description" required>Description</FormLabel>
              <Input
                id="description"
                {...register("description")}
                aria-invalid={!!errors.description}
                disabled={isPending}
              />
              <FormFieldError message={errors.description?.message} />
            </div>

            <div>
              <FormLabel htmlFor="contactGroupUuid">Contact group</FormLabel>
              <Controller
                name="contactGroupUuid"
                control={control}
                render={({ field }) => (
                  <Select
                    id="contactGroupUuid"
                    options={groupOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="-empty-"
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="quicklyChangeOrder" className="shrink-0 text-sm font-medium text-gray-700">
                Quickly change order
              </label>
              <Input
                id="quicklyChangeOrder"
                {...register("quicklyChangeOrder")}
                disabled={isPending}
                className="w-24"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasPriceDate"
                {...register("hasPriceDate")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="hasPriceDate" className="shrink-0 text-sm font-medium text-gray-700">
                Price date
              </label>
              {hasPriceDate && (
                <Controller
                  name="priceDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isPending}
                      className="w-44"
                    />
                  )}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="linkToNewCustomer"
                {...register("linkToNewCustomer")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="linkToNewCustomer" className="text-sm font-medium text-gray-700">
                Link this contact to a new customer
              </label>
            </div>
          </div>
        </section>

        {/* ── Search codes ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Search codes
          </h2>
          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="searchCode1">Searchcode</FormLabel>
              <Input id="searchCode1" {...register("searchCode1")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode2">Searchcode</FormLabel>
              <Input id="searchCode2" {...register("searchCode2")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode3">Searchcode</FormLabel>
              <Input id="searchCode3" {...register("searchCode3")} disabled={isPending} />
            </div>
          </div>
        </section>

        {/* ── Website ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Website
          </h2>
          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="websiteSorting">Website sorting</FormLabel>
              <Input
                id="websiteSorting"
                type="number"
                min={0}
                {...register("websiteSorting")}
                disabled={isPending}
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hideOnWebsite"
                {...register("hideOnWebsite")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="hideOnWebsite" className="text-sm font-medium text-gray-700">
                Hide on website
              </label>
            </div>
          </div>
        </section>
      </div>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/contacts")}
        submitLabel="Create Contact"
      />
    </form>
  );
};
