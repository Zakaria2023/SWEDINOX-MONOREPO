"use client";

import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { type ContactGroupOption } from "@/app/(dashboard)/contacts/actions";
import { useContactSubmit } from "@/app/(dashboard)/contacts/use-contact-submit";
import { contactTypes } from "@/lib/enums";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";

type ContactFormProps = {
  groups: ContactGroupOption[];
};

export const ContactForm = ({ groups }: ContactFormProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useContactSubmit();
  const { register, watch, setValue, control, formState: { errors } } = form;

  const contactType = watch("contactType");
  const hasPriceDate = watch("hasPriceDate");

  useEffect(() => {
    if (state.success) {
      router.push("/contacts");
    }
  }, [router, state.success]);

  const groupOptions = [
    { value: "", label: t("common.empty-option") },
    ...groups.map((group) => ({ value: group.uuid, label: group.name })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr_200px_200px]">
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            {t("contact-form.sections.contact-type")}
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
                <span className="text-sm text-gray-700">
                  {t(`contact-form.contact-types.${type}`)}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            {t("contact-form.sections.contact")}
          </h2>
          <div className="grid gap-4">
            <div>
              <FormLabel htmlFor="description" required>
                {t("contact-form.fields.description")}
              </FormLabel>
              <Input
                id="description"
                {...register("description")}
                aria-invalid={!!errors.description}
                disabled={isPending}
              />
              <FormFieldError message={errors.description?.message} />
            </div>

            <div>
              <FormLabel htmlFor="contactGroupUuid">
                {t("contact-form.fields.contact-group")}
              </FormLabel>
              <Controller
                name="contactGroupUuid"
                control={control}
                render={({ field }) => (
                  <Select
                    id="contactGroupUuid"
                    options={groupOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={t("common.empty-option")}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor="quicklyChangeOrder"
                className="shrink-0 text-sm font-medium text-gray-700"
              >
                {t("contact-form.fields.quickly-change-order")}
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
              <label
                htmlFor="hasPriceDate"
                className="shrink-0 text-sm font-medium text-gray-700"
              >
                {t("contact-form.fields.price-date")}
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
                {t("contact-form.fields.link-to-new-customer")}
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            {t("contact-form.sections.search-codes")}
          </h2>
          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="searchCode1">
                {t("contact-form.fields.search-code")}
              </FormLabel>
              <Input id="searchCode1" {...register("searchCode1")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode2">
                {t("contact-form.fields.search-code")}
              </FormLabel>
              <Input id="searchCode2" {...register("searchCode2")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode3">
                {t("contact-form.fields.search-code")}
              </FormLabel>
              <Input id="searchCode3" {...register("searchCode3")} disabled={isPending} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            {t("contact-form.sections.website")}
          </h2>
          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="websiteSorting">
                {t("contact-form.fields.website-sorting")}
              </FormLabel>
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
                {t("contact-form.fields.hide-on-website")}
              </label>
            </div>
          </div>
        </section>
      </div>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/contacts")}
        submitLabel={t("contact-form.submit")}
      />
    </form>
  );
};
