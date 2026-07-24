"use client";

import { useFormContext } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { ContactOption } from "@/app/(dashboard)/visit-reports/actions";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  isPending: boolean;
  contacts: ContactOption[];
  loadingContacts: boolean;
};

export const AddressAndContactSection = ({
  isPending,
  contacts,
  loadingContacts,
}: Props) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<VisitReportFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Address and Contact
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormLabel htmlFor="address">Address</FormLabel>
          <Input id="address" {...register("address")} disabled={isPending} />
          <FormFieldError message={errors.address?.message} />
        </div>

        <div>
          <FormLabel htmlFor="postalCode">Postal Code</FormLabel>
          <Input
            id="postalCode"
            {...register("postalCode")}
            disabled={isPending}
          />
          <FormFieldError message={errors.postalCode?.message} />
        </div>

        <div>
          <FormLabel htmlFor="city">City</FormLabel>
          <Input id="city" {...register("city")} disabled={isPending} />
          <FormFieldError message={errors.city?.message} />
        </div>

        <div>
          <FormLabel htmlFor="telephone">Tel</FormLabel>
          <Input
            id="telephone"
            {...register("telephone")}
            disabled={isPending}
          />
          <FormFieldError message={errors.telephone?.message} />
        </div>

        <div>
          <FormLabel htmlFor="fax">Fax</FormLabel>
          <Input id="fax" {...register("fax")} disabled={isPending} />
          <FormFieldError message={errors.fax?.message} />
        </div>

        <div className="md:col-span-2">
          <FormSelectField
            control={control}
            id="contactUuid"
            name="contactUuid"
            label="Contact"
            options={[
              { value: "", label: "Select an option" },
              ...contacts.map((c) => ({
                value: c.uuid,
                label: [c.firstName, c.lastName].filter(Boolean).join(" "),
              })),
            ]}
            emptyValue=""
            disabled={isPending || loadingContacts || contacts.length === 0}
            errorMessage={errors.contactUuid?.message}
          />
        </div>
      </div>
    </section>
  );
};
