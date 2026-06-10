"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Button } from "@/components/shadcn/button";
import { FormLabel, FormFieldError } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { User } from "lucide-react";
import { contactSalutations, companyContactCategories, type CompanyContactCategory } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import type { ContactInput } from "@/app/(dashboard)/companies/actions";

const contactDialogSchema = z.object({
  salutation: z.union([z.enum(contactSalutations), z.literal(""), z.undefined()]),
  firstName: z.string().optional(),
  initials: z.string().optional(),
  lastName: z.string().optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  email: z.union([
    z.email({ error: "Invalid email address" }),
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

type ContactDialogFormValues = z.infer<typeof contactDialogSchema>;

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

const salutationOptions = [
  { value: "", label: "—" },
  ...contactSalutations.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (contact: ContactInput) => void;
};

export const ContactDialog = ({ open, onOpenChange, onAdd }: ContactDialogProps) => {
  const form = useForm<ContactDialogFormValues>({
    resolver: zodResolver(contactDialogSchema),
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

  const toggleCategory = (value: string) => {
    const current = selectedCategories ?? [];
    setValue(
      "categories",
      current.includes(value) ? current.filter((c) => c !== value) : [...current, value],
    );
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) form.reset(DEFAULT_VALUES);
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit((values) => {
    onAdd({
      uuid: generateUuid(),
      salutation: (values.salutation as typeof contactSalutations[number]) || undefined,
      firstName: values.firstName || undefined,
      initials: values.initials || undefined,
      lastName: values.lastName || undefined,
      fullName: [values.firstName, values.lastName].filter(Boolean).join(" ") || "Contact",
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
            Company Contact
          </DialogTitle>
          <DialogDescription>
            Add a contact person for this company.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="contact-dialog-form" onSubmit={onSubmit} className="space-y-6">

            {/* ── Contact person ──────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                Contact person
              </h3>
              <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <FormSelectField
                    control={control}
                    id="salutation"
                    name="salutation"
                    label="Salutation"
                    options={salutationOptions}
                    emptyValue=""
                  />
                </div>

                <div>
                  <FormLabel htmlFor="firstName">Name</FormLabel>
                  <Input id="firstName" {...register("firstName")} />
                </div>

                <div>
                  <FormLabel htmlFor="initials">Initials</FormLabel>
                  <Input id="initials" {...register("initials")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="lastName">Last name</FormLabel>
                  <Input id="lastName" {...register("lastName")} />
                </div>

                <div>
                  <FormLabel htmlFor="telephone">Telephone</FormLabel>
                  <Input id="telephone" {...register("telephone")} />
                </div>

                <div>
                  <FormLabel htmlFor="mobile">Mobile</FormLabel>
                  <Input id="mobile" {...register("mobile")} />
                </div>

                <div>
                  <FormLabel htmlFor="fax">Fax</FormLabel>
                  <Input id="fax" {...register("fax")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="email">E-mail</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                  />
                  <FormFieldError message={errors.email?.message} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="categoryAddition">Category addition</FormLabel>
                  <Input id="categoryAddition" {...register("categoryAddition")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="btwNumber">BTW-nummer</FormLabel>
                  <Input id="btwNumber" {...register("btwNumber")} />
                </div>
              </div>
            </section>

            {/* ── Address ─────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                Address
              </h3>
              <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <FormLabel htmlFor="country">Country</FormLabel>
                  <Input id="country" {...register("country")} />
                </div>

                <div>
                  <FormLabel htmlFor="postalCode">Postal code</FormLabel>
                  <Input id="postalCode" {...register("postalCode")} />
                </div>

                <div>
                  <FormLabel htmlFor="house">House</FormLabel>
                  <Input id="house" {...register("house")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40 sm:w-fit">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border accent-primary"
                      {...register("poBox")}
                    />
                    <span className="text-sm font-medium text-gray-700">P.O. Box</span>
                  </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="streetAndNumber">Street + No</FormLabel>
                  <Input id="streetAndNumber" {...register("streetAndNumber")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="annex">Annex</FormLabel>
                  <Input id="annex" {...register("annex")} />
                </div>

                <div>
                  <FormLabel htmlFor="city">City</FormLabel>
                  <Input id="city" {...register("city")} />
                </div>

                <div>
                  <FormLabel htmlFor="region">Region</FormLabel>
                  <Input id="region" {...register("region")} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <FormLabel htmlFor="website">Website</FormLabel>
                  <Input id="website" {...register("website")} />
                </div>
              </div>
            </section>

            {/* ── Categories ──────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                Categories
              </h3>
              <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {companyContactCategories.map((cat) => (
                  <label
                    key={cat}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border accent-primary"
                      checked={(selectedCategories ?? []).includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span className="text-sm font-medium capitalize text-gray-700">
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* ── Sequence number ─────────────────────────────── */}
            <section>
              <div className="w-40">
                <FormLabel htmlFor="sequenceNumber">Sequence number</FormLabel>
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
              Cancel
            </Button>
            <Button type="submit" form="contact-dialog-form">
              Save Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
