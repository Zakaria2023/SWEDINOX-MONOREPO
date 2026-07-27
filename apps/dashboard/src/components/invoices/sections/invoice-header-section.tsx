"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { InvoiceFormValues } from "@/app/(dashboard)/invoices/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Select } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { Controller, useFormContext } from "react-hook-form";

type InvoiceHeaderSectionProps = {
  isPending: boolean;
  availableCompanies: CompanyOption[];
};

export const InvoiceHeaderSection = ({
  isPending,
  availableCompanies,
}: InvoiceHeaderSectionProps) => {
  const { control } = useFormContext<InvoiceFormValues>();

  const companyOptions = [
    { value: "", label: "Empty" },
    ...availableCompanies.map((c) => ({
      value: c.uuid,
      label: [c.searchCode1, c.companyName].filter(Boolean).join(" — "),
    })),
  ];

  return (
    <div className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Invoice
      </h2>
      <div>
        <FormLabel htmlFor="companyUuid">Customer</FormLabel>
        <Controller
          name="companyUuid"
          control={control}
          render={({ field }) => (
            <Select
              id="companyUuid"
              options={companyOptions}
              value={field.value ?? ""}
              onValueChange={(v) => field.onChange(v || undefined)}
              disabled={isPending}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Invoice Date</FormLabel>
          <Controller
            name="invoiceDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
        <div>
          <FormLabel>Expiration Date</FormLabel>
          <Controller
            name="expirationDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};
