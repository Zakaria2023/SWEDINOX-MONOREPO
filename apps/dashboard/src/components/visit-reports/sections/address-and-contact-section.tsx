"use client";

import { useFormContext } from "react-hook-form";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { ContactOption } from "@/app/(dashboard)/visit-reports/actions";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  isPending: boolean;
  contacts: ContactOption[];
  loadingContacts: boolean;
};

// The contact person seen. The address visited is the company's visiting
// address and is shown from the company, so it is not typed here.
export const AddressAndContactSection = ({
  isPending,
  contacts,
  loadingContacts,
}: Props) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<VisitReportFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Contact
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
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
