"use client";

import { z } from "zod";
import { User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import type { ContactInput } from "@/app/(dashboard)/companies/actions";
import { generateUuid } from "@/lib/helpers";
import {
  companyContactCategories,
  contactSalutations,
  type CompanyContactCategory,
} from "@/lib/enums";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

const createContactDialogSchema = (invalidEmailAddressMessage: string) =>
  z.object({
    salutation: z.union([z.enum(contactSalutations), z.literal(""), z.undefined()]),
    firstName: z.string().optional(),
    initials: z.string().optional(),
    lastName: z.string().optional(),
    telephone: z.string().optional(),
    mobile: z.string().optional(),
    fax: z.string().optional(),
    email: z.union([
      z.email({ error: invalidEmailAddressMessage }),
      z.literal(""),
      z.undefined(),
    ]),
    categoryAddition: z.string().optional(),
    btwNumber: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    house: z.string().optional(),
    poBox: z.boolean().optional(),
    streetAndNumber: z.string().optional(),
    annex: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    website: z.string().optional(),
    categories: z.array(z.string()),
    sequenceNumber: z.union([z.string(), z.literal(""), z.undefined()]),
    isActive: z.boolean(),
  });

type ContactDialogFormValues = z.infer<ReturnType<typeof createContactDialogSchema>>;

const DEFAULT_VALUES: ContactDialogFormValues = {
  salutation: "",
  firstName: "",
  initials: "",
  lastName: "",
  telephone: "",
  mobile: "",
  fax: "",
  email: "",
  categoryAddition: "",
  btwNumber: "",
  country: "",
  postalCode: "",
  house: "",
  poBox: false,
  streetAndNumber: "",
  annex: "",
  city: "",
  region: "",
  website: "",
  categories: [],
  sequenceNumber: "",
  isActive: true,
};

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (contact: ContactInput) => void;
};

export const ContactDialog = ({
  open,
  onOpenChange,
  onAdd,
}: ContactDialogProps) => {
  const { t } = useTranslation();
  const form = useForm<ContactDialogFormValues>({
    resolver: zodResolver(
      createContactDialogSchema(t("validation.invalid-email-address")),
    ),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedCategories = watch("categories");
  const salutationOptions = [
    { value: "", label: t("common.empty-option") },
    ...contactSalutations.map((salutation) => ({
      value: salutation,
      label: t(`contact-dialog.salutations.${salutation}`),
    })),
  ];

  const toggleCategory = (value: string) => {
    const current = selectedCategories ?? [];
    setValue(
      "categories",
      current.includes(value) ? current.filter((category) => category !== value) : [...current, value],
    );
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit((values) => {
    onAdd({
      uuid: generateUuid(),
      salutation:
        (values.salutation as (typeof contactSalutations)[number]) || undefined,
      firstName: values.firstName || undefined,
      initials: values.initials || undefined,
      lastName: values.lastName || undefined,
      fullName:
        [values.firstName, values.lastName].filter(Boolean).join(" ") ||
        t("contact-dialog.default-full-name"),
      telephone: values.telephone || undefined,
      mobile: values.mobile || undefined,
      fax: values.fax || undefined,
      email: values.email || undefined,
      website: values.website || undefined,
      categoryAddition: values.categoryAddition || undefined,
      btwNumber: values.btwNumber || undefined,
      sequenceNumber:
        values.sequenceNumber !== "" && values.sequenceNumber !== undefined
          ? Number(values.sequenceNumber)
          : undefined,
      streetAndNumber: values.streetAndNumber || undefined,
      house: values.house || undefined,
      poBox: values.poBox ?? false,
      city: values.city || undefined,
      postalCode: values.postalCode || undefined,
      country: values.country || undefined,
      region: values.region || undefined,
      annex: values.annex || undefined,
      categories: values.categories as CompanyContactCategory[],
      isActive: values.isActive,
    });
    handleClose(false);
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <User className="size-4" />
            {t("contact-dialog.title")}
          </DialogTitle>
          <DialogDescription>{t("contact-dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="contact-dialog-form" onSubmit={onSubmit} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {t("contact-dialog.sections.contact-person")}
              </h3>
              <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <FormSelectField
                    control={control}
                    id="salutation"
                    name="salutation"
                    label={t("contact-dialog.fields.salutation")}
                    options={salutationOptions}
                    emptyValue=""
                  />
                </div>

                <div>
                  <FormLabel htmlFor="firstName">
                    {t("contact-dialog.fields.first-name")}
                  </FormLabel>
                  <Input id="firstName" {...register("firstName")} />
                </div>

                <div>
                  <FormLabel htmlFor="initials">
                    {t("contact-dialog.fields.initials")}
                  </FormLabel>
                  <Input id="initials" {...register("initials")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="lastName">
                    {t("contact-dialog.fields.last-name")}
                  </FormLabel>
                  <Input id="lastName" {...register("lastName")} />
                </div>

                <div>
                  <FormLabel htmlFor="telephone">
                    {t("contact-dialog.fields.telephone")}
                  </FormLabel>
                  <Input id="telephone" {...register("telephone")} />
                </div>

                <div>
                  <FormLabel htmlFor="mobile">
                    {t("contact-dialog.fields.mobile")}
                  </FormLabel>
                  <Input id="mobile" {...register("mobile")} />
                </div>

                <div>
                  <FormLabel htmlFor="fax">{t("contact-dialog.fields.fax")}</FormLabel>
                  <Input id="fax" {...register("fax")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="email">
                    {t("contact-dialog.fields.email")}
                  </FormLabel>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                  />
                  <FormFieldError message={errors.email?.message} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="categoryAddition">
                    {t("contact-dialog.fields.category-addition")}
                  </FormLabel>
                  <Input id="categoryAddition" {...register("categoryAddition")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="btwNumber">
                    {t("contact-dialog.fields.btw-number")}
                  </FormLabel>
                  <Input id="btwNumber" {...register("btwNumber")} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {t("contact-dialog.sections.address")}
              </h3>
              <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <FormLabel htmlFor="country">
                    {t("contact-dialog.fields.country")}
                  </FormLabel>
                  <Input id="country" {...register("country")} />
                </div>

                <div>
                  <FormLabel htmlFor="postalCode">
                    {t("contact-dialog.fields.postal-code")}
                  </FormLabel>
                  <Input id="postalCode" {...register("postalCode")} />
                </div>

                <div>
                  <FormLabel htmlFor="house">
                    {t("contact-dialog.fields.house")}
                  </FormLabel>
                  <Input id="house" {...register("house")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40 sm:w-fit">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border accent-primary"
                      {...register("poBox")}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t("contact-dialog.fields.po-box")}
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="streetAndNumber">
                    {t("contact-dialog.fields.street-and-number")}
                  </FormLabel>
                  <Input id="streetAndNumber" {...register("streetAndNumber")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="annex">
                    {t("contact-dialog.fields.annex")}
                  </FormLabel>
                  <Input id="annex" {...register("annex")} />
                </div>

                <div>
                  <FormLabel htmlFor="city">{t("contact-dialog.fields.city")}</FormLabel>
                  <Input id="city" {...register("city")} />
                </div>

                <div>
                  <FormLabel htmlFor="region">
                    {t("contact-dialog.fields.region")}
                  </FormLabel>
                  <Input id="region" {...register("region")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="website">
                    {t("contact-dialog.fields.website")}
                  </FormLabel>
                  <Input id="website" {...register("website")} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {t("contact-dialog.sections.categories")}
              </h3>
              <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {companyContactCategories.map((category) => (
                  <label
                    key={category}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border accent-primary"
                      checked={(selectedCategories ?? []).includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t(`contact-dialog.categories.${category}`)}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <div className="w-40">
                <FormLabel htmlFor="sequenceNumber">
                  {t("contact-dialog.fields.sequence-number")}
                </FormLabel>
                <Input
                  id="sequenceNumber"
                  type="number"
                  min={0}
                  {...register("sequenceNumber")}
                />
              </div>
            </section>
          </form>
        </div>

        <div className="shrink-0 border-t bg-background px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="contact-dialog-form">
              {t("contact-dialog.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
