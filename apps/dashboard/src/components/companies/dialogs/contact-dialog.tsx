"use client";

import { ContactDialogValues } from "@/app/(dashboard)/companies/validation";
import { ContactCategory } from "@/lib/enums";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import {
  contactCategories,
  contactSalutations,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  CONTACT_CATEGORY_LABELS,
  CONTACT_SALUTATION_LABELS,
} from "@/lib/labels";
import { User } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<ContactDialogValues>;
  toggleContactCategory: (cat: ContactCategory) => void;
};

export const ContactDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  toggleContactCategory,
}: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <User className="size-4" />
            Contact
          </DialogTitle>
          <DialogDescription>
            Add a contact person for this company.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSave}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Contact Person
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-salutation">Salutation</FormLabel>
                  <Controller
                    name="salutation"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        id="co-salutation"
                        options={[
                          { value: "", label: COMMON_TEXT.emptyOption },
                          ...contactSalutations.map((s) => ({
                            value: s,
                            label: CONTACT_SALUTATION_LABELS[s],
                          })),
                        ]}
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder={COMMON_TEXT.emptyOption}
                      />
                    )}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-firstName">First Name</FormLabel>
                  <Input
                    id="co-firstName"
                    {...form.register("firstName")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-initials">Initials</FormLabel>
                  <Input
                    id="co-initials"
                    {...form.register("initials")}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-lastName">Last Name</FormLabel>
                  <Input
                    id="co-lastName"
                    {...form.register("lastName")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-telephone">Telephone</FormLabel>
                  <Input
                    id="co-telephone"
                    {...form.register("telephone")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-mobile">Mobile</FormLabel>
                  <Input id="co-mobile" {...form.register("mobile")} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-fax">Fax</FormLabel>
                  <Input id="co-fax" {...form.register("fax")} />
                </div>
                <div>
                  <FormLabel htmlFor="co-email">Email</FormLabel>
                  <Input
                    id="co-email"
                    type="email"
                    {...form.register("email")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-address">Address</FormLabel>
                  <Input
                    id="co-address"
                    {...form.register("address")}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-categoryAddition">
                    Category Addition
                  </FormLabel>
                  <Input
                    id="co-categoryAddition"
                    {...form.register("categoryAddition")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-btwNumber">BTW Number</FormLabel>
                  <Input
                    id="co-btwNumber"
                    {...form.register("btwNumber")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Address</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-country">Country</FormLabel>
                  <Input
                    id="co-country"
                    {...form.register("country")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-postal">Postal</FormLabel>
                  <Input id="co-postal" {...form.register("postal")} />
                </div>
                <div>
                  <FormLabel htmlFor="co-house">House</FormLabel>
                  <Input id="co-house" {...form.register("house")} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="poBox"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="co-poBox"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FormLabel htmlFor="co-poBox">PO Box</FormLabel>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-streetAndNo">Street & No</FormLabel>
                  <Input
                    id="co-streetAndNo"
                    {...form.register("streetAndNo")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-annex">Annex</FormLabel>
                  <Input id="co-annex" {...form.register("annex")} />
                </div>
                <div>
                  <FormLabel htmlFor="co-postalCode">Postal Code</FormLabel>
                  <Input
                    id="co-postalCode"
                    {...form.register("postalCode")}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-city">City</FormLabel>
                  <Input id="co-city" {...form.register("city")} />
                </div>
                <div>
                  <FormLabel htmlFor="co-region">Region</FormLabel>
                  <Input id="co-region" {...form.register("region")} />
                </div>
                <div>
                  <FormLabel htmlFor="co-addressCountry">Country</FormLabel>
                  <Input
                    id="co-addressCountry"
                    {...form.register("addressCountry")}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FormLabel htmlFor="co-addressTelephone">
                    Telephone
                  </FormLabel>
                  <Input
                    id="co-addressTelephone"
                    {...form.register("addressTelephone")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-addressFax">Fax</FormLabel>
                  <Input
                    id="co-addressFax"
                    {...form.register("addressFax")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="co-addressEmail">Email</FormLabel>
                  <Input
                    id="co-addressEmail"
                    type="email"
                    {...form.register("addressEmail")}
                  />
                </div>
              </div>
              <div>
                <FormLabel htmlFor="co-website">Website</FormLabel>
                <Input id="co-website" {...form.register("website")} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Categories
              </h3>
              <Controller
                name="categories"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {contactCategories.map((cat) => (
                      <label
                        key={cat}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={(field.value as string[]).includes(cat)}
                          onChange={() => toggleContactCategory(cat)}
                        />
                        <span className="text-sm text-gray-700">
                          {CONTACT_CATEGORY_LABELS[cat]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Sequence Number
              </h3>
              <div className="w-32">
                <Input
                  type="number"
                  min={1}
                  {...form.register("sequenceNumber", {
                    valueAsNumber: true,
                  })}
                />
                <FormFieldError
                  message={
                    form.formState.errors.sequenceNumber?.message
                  }
                />
              </div>
            </div>
          </div>

          <DialogFormFooter
            onCancel={onCancel}
            submitLabel="Add Contact"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
